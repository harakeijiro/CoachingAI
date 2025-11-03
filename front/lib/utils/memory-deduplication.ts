/**
 * メモリの重複統合ユーティリティ
 * 類似メモリの統合と重複チェック機能を提供
 */

import type { ExtractedMemory, Memory } from "@/lib/types/memory";

/**
 * 2つのメモリが類似しているかを判定
 * @param memory1 比較対象のメモリ1
 * @param memory2 比較対象のメモリ2
 * @param threshold 類似度の閾値（デフォルト0.7）
 * @returns 類似している場合true
 */
function areMemoriesSimilar(
  memory1: ExtractedMemory | Memory,
  memory2: ExtractedMemory | Memory,
  threshold: number = 0.7
): boolean {
  // 同じトピックで内容が類似しているか判定
  const topicSimilar = memory1.topic === memory2.topic || 
    areTopicsSimilar(memory1.topic, memory2.topic);
  
  if (!topicSimilar) return false;

  // 内容が完全一致している場合は、無条件で類似と判定
  if (memory1.content.trim() === memory2.content.trim()) {
    return true;
  }

  // 内容の類似度を計算（簡易版：文字列類似度）
  const contentSimilarity = calculateSimilarity(
    memory1.content,
    memory2.content
  );

  // 同じトピックの場合は、内容の類似度判定を緩和（0.3以上で類似と判定）
  // 例：「35歳」と「30歳または35歳」も統合される
  const topicExactMatch = memory1.topic === memory2.topic;
  const adjustedThreshold = topicExactMatch ? 0.3 : threshold;

  const isSimilar = contentSimilarity >= adjustedThreshold;

  return isSimilar;
}

/**
 * トピックの類似度を判定（改善版）
 * 同じ意味のトピックかを判定（例：「挨拶の仕方」「挨拶の仕方に対する感情」→ 同じトピック）
 */
function areTopicsSimilar(topic1: string, topic2: string): boolean {
  // トピックを正規化（助詞や補助的な単語を削除）
  const normalizeTopic = (t: string) => {
    return t
      .replace(/[のへの]/g, "") // 助詞を削除
      .replace(/こと|行動|意図|要求|試み|認識|呼びかけ|呼んでもらう|アシスタントへの?|アシスタントによる?|アシスタントが/g, "") // 補助的な単語を削除
      .replace(/に対する|について|に関して|に関する|についての/g, "") // 「に対する感情」などを削除
      .replace(/感情|認識|記憶|理解|考え|意見|見解/g, "") // 感情・認識などの補助的な単語を削除
      .trim();
  };
  
  const normalized1 = normalizeTopic(topic1);
  const normalized2 = normalizeTopic(topic2);
  
  // 完全一致
  if (normalized1 === normalized2) return true;
  
  // 包含関係のチェック（一方が他方に含まれているか）
  if (normalized1.length > 0 && normalized2.includes(normalized1)) return true;
  if (normalized2.length > 0 && normalized1.includes(normalized2)) return true;
  
  // キーワード抽出（重要単語のみ）
  const extractKeywords = (t: string) => {
    // カタカナ、ひらがな、漢字を含む単語を抽出
    return t
      .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g, " ") // 非文字を空白に
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0 && w.length >= 2); // 2文字以上の単語のみ
  };
  
  const keywords1 = extractKeywords(normalized1);
  const keywords2 = extractKeywords(normalized2);
  
  if (keywords1.length === 0 || keywords2.length === 0) {
    // キーワードが抽出できない場合は、包含関係で判定
    return false;
  }
  
  // キーワードの重複率を計算
  const commonKeywords = keywords1.filter(k => keywords2.includes(k));
  const totalUniqueKeywords = new Set([...keywords1, ...keywords2]).size;
  
  if (totalUniqueKeywords === 0) return false;
  
  // 50%以上のキーワードが共通している場合は類似と判定
  const similarity = commonKeywords.length / totalUniqueKeywords;
  return similarity >= 0.5;
}

/**
 * 文字列の類似度を計算（簡易版）
 * より詳細な類似度計算が必要な場合は、本格的なライブラリを使用
 * @param str1 文字列1
 * @param str2 文字列2
 * @returns 類似度（0.0〜1.0）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.trim();
  const s2 = str2.trim();
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  // 完全一致
  if (s1 === s2) return 1.0;
  
  // 部分文字列一致を確認（短い文字列が長い文字列に含まれている）
  if (shorter.length > 0 && longer.includes(shorter)) {
    // 短い文字列の長さが長い文字列の長さの50%以上の場合、高い類似度とする
    const ratio = shorter.length / longer.length;
    return ratio >= 0.5 ? 0.9 : 0.6;
  }
  
  // 長い文字列が短い文字列に含まれている場合
  if (longer.length > 0 && shorter.includes(longer)) {
    return 0.85;
  }
  
  // 数字や重要キーワードの一致をチェック（例：「35歳」と「30歳または35歳」）
  const extractNumbers = (str: string) => str.match(/\d+/g) || [];
  const numbers1 = extractNumbers(s1);
  const numbers2 = extractNumbers(s2);
  
  if (numbers1.length > 0 && numbers2.length > 0) {
    // 共通の数字がある場合、類似度を上げる
    const commonNumbers = numbers1.filter(n => numbers2.includes(n));
    if (commonNumbers.length > 0) {
      const numberSimilarity = commonNumbers.length / Math.max(numbers1.length, numbers2.length);
      if (numberSimilarity >= 0.5) {
        return 0.6 + numberSimilarity * 0.3; // 0.6〜0.9の範囲
      }
    }
  }
  
  // 簡易的な文字列距離計算（Levenshtein距離の簡易版）
  const maxLength = Math.max(s1.length, s2.length);
  const minLength = Math.min(s1.length, s2.length);
  
  // 長さの差が大きすぎる場合は類似度を低くする
  if (maxLength > 0 && minLength / maxLength < 0.3) {
    return 0.0;
  }
  
  // 簡単な文字一致率を計算（共通文字の割合）
  const commonChars = countCommonChars(s1, s2);
  const similarity = commonChars / maxLength;
  
  // より緩い基準で判定（0.5以上で類似と判定）
  return similarity >= 0.5 ? similarity : 0.0;
}

/**
 * 2つの文字列の共通文字数をカウント（簡易版）
 */
function countCommonChars(str1: string, str2: string): number {
  const chars1 = str1.split("");
  const chars2 = str2.split("");
  let commonCount = 0;
  
  const used = new Set<number>();
  for (const char1 of chars1) {
    for (let i = 0; i < chars2.length; i++) {
      if (!used.has(i) && char1 === chars2[i]) {
        commonCount++;
        used.add(i);
        break;
      }
    }
  }
  
  return commonCount;
}

/**
 * 配列内のメモリを重複統合
 * 同じトピックで類似した内容のメモリを統合し、信頼度が高い方を優先
 */
export function deduplicateWithinArray(
  memories: ExtractedMemory[]
): ExtractedMemory[] {
  const result: ExtractedMemory[] = [];
  
  for (const memory of memories) {
    // 既に追加済みのメモリと類似しているかチェック
    const similarIndex = result.findIndex((r) => 
      areMemoriesSimilar(memory, r)
    );
    
    if (similarIndex === -1) {
      // 類似メモリがない場合は追加
      result.push(memory);
    } else {
      // 類似メモリがある場合、信頼度が高い方を優先
      const similar = result[similarIndex];
      if (memory.confidence > similar.confidence) {
        // 現在のメモリの方が信頼度が高い場合は置き換え
        result[similarIndex] = memory;
      }
      // 既存の方が信頼度が高い場合はそのまま（何もしない）
    }
  }
  
  return result;
}

/**
 * 抽出されたメモリと既存メモリを統合
 * 既存メモリと類似している場合は、信頼度が高い方を優先
 * 同じトピックで内容が異なる場合は、既存メモリを更新対象として扱う
 * 新しいメモリ同士の重複も統合
 * 
 * @param newMemories 新しく抽出されたメモリ
 * @param existingMemories 既存のメモリ（DBから取得）
 * @returns 統合後のメモリ配列と更新対象の既存メモリID
 */
export function deduplicateMemories(
  newMemories: ExtractedMemory[],
  existingMemories: Memory[]
): {
  memories: ExtractedMemory[];
  memoriesToUpdate: Array<{ memory_id: string; newMemory: ExtractedMemory }>;
} {
  // まず、新しいメモリ同士の重複を統合
  const deduplicatedNew = deduplicateWithinArray(newMemories);
  
  const result: ExtractedMemory[] = [];
  const memoriesToUpdate: Array<{ memory_id: string; newMemory: ExtractedMemory }> = [];
  
  for (const newMemory of deduplicatedNew) {
    // 同じトピックの既存メモリを探す（完全一致または類似）
    const sameTopicExisting = existingMemories.find((existing) => {
      // 同じトピックか、類似したトピックかチェック
      const topicMatch = existing.topic === newMemory.topic || 
        areTopicsSimilar(existing.topic, newMemory.topic);
      
      if (!topicMatch) return false;
      
      // 内容が異なる場合は更新対象
      return existing.content.trim() !== newMemory.content.trim();
    });
    
    if (sameTopicExisting) {
      // 同じトピックで内容が異なる場合は更新対象
      // 訂正の場合は信頼度に関係なく更新（ユーザーが明示的に訂正しているため）
      const existingConfidence = sameTopicExisting.confidence || 0;
      
      // 信頼度が同じか高い場合、または信頼度の差が0.1以内の場合は更新（訂正として扱う）
      if (newMemory.confidence >= existingConfidence - 0.1) {
        // 新しいメモリの方が信頼度が高い、またはほぼ同じ場合は更新（訂正）
        memoriesToUpdate.push({
          memory_id: sameTopicExisting.memory_id,
          newMemory: newMemory,
        });
        result.push(newMemory);
      }
      // 既存の方が信頼度が大幅に高い場合のみスキップ（0.1以上の差がある場合）
    } else {
      // 既存メモリと類似しているかチェック（内容が同じ場合）
      const similarExisting = existingMemories.find((existing) =>
        areMemoriesSimilar(newMemory, existing)
      );
      
      if (similarExisting) {
        // 類似メモリがある場合、信頼度を比較
        const existingConfidence = similarExisting.confidence || 0;
        
        if (newMemory.confidence > existingConfidence) {
          // 新しいメモリの方が信頼度が高い場合は追加（既存は更新対象として扱う）
          result.push(newMemory);
        }
        // 既存の方が信頼度が高い場合はスキップ（重複として扱う）
      } else {
        // 既存メモリと類似していない場合は追加
        result.push(newMemory);
      }
    }
  }
  
  // 結果内での重複も再度チェック（念のため）
  const finalMemories = deduplicateWithinArray(result);
  
  return {
    memories: finalMemories,
    memoriesToUpdate: memoriesToUpdate,
  };
}
