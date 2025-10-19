#!/usr/bin/env node

/**
 * 環境変数チェックスクリプト
 * 必要な環境変数が正しく設定されているか確認します
 */

const fs = require('fs');
const path = require('path');

// 必須の環境変数
const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'CARTESIA_API_KEY',
];

// オプションの環境変数（デフォルト値あり）
const OPTIONAL_VARS = [
  { name: 'GEMINI_MODEL', default: 'gemini-2.5-flash' },
  { name: 'CARTESIA_VERSION', default: '2025-04-16' },
  { name: 'NEXT_PUBLIC_APP_URL', default: 'http://localhost:3000' },
];

console.log('🔍 環境変数をチェック中...\n');

// .env.local ファイルの存在確認
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local ファイルが見つかりません！');
  console.log('\n📝 以下のコマンドで作成してください:');
  console.log('   cp .env.example .env.local');
  console.log('   その後、実際のAPIキーを設定してください。\n');
  process.exit(1);
}

console.log('✅ .env.local ファイルが存在します\n');

// 環境変数を読み込み
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    envVars[key.trim()] = value.trim();
  }
});

let hasErrors = false;
let hasWarnings = false;

// 必須の環境変数をチェック
console.log('📋 必須の環境変数:');
REQUIRED_VARS.forEach(varName => {
  const value = envVars[varName];
  
  if (!value) {
    console.error(`   ❌ ${varName}: 未設定`);
    hasErrors = true;
  } else if (value.includes('your-') || value.includes('your_')) {
    console.error(`   ⚠️  ${varName}: プレースホルダーのまま（実際の値を設定してください）`);
    hasErrors = true;
  } else if (value.length < 10) {
    console.warn(`   ⚠️  ${varName}: 値が短すぎる可能性があります`);
    hasWarnings = true;
  } else {
    const maskedValue = value.substring(0, 20) + '...';
    console.log(`   ✅ ${varName}: ${maskedValue}`);
  }
});

console.log('\n📋 オプションの環境変数:');
OPTIONAL_VARS.forEach(({ name, default: defaultValue }) => {
  const value = envVars[name];
  
  if (!value) {
    console.log(`   ℹ️  ${name}: 未設定（デフォルト: ${defaultValue}）`);
  } else {
    console.log(`   ✅ ${name}: ${value}`);
  }
});

// Supabase URL の形式チェック
console.log('\n🔍 追加チェック:');
const supabaseUrl = envVars['SUPABASE_URL'];
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('   ❌ SUPABASE_URL は https:// で始まる必要があります');
  hasErrors = true;
} else if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
  console.log('   ✅ SUPABASE_URL の形式が正しいです');
} else if (supabaseUrl) {
  console.warn('   ⚠️  SUPABASE_URL の形式が通常と異なります');
  hasWarnings = true;
}

// Supabase Anon Key の形式チェック（JWT形式）
const supabaseKey = envVars['SUPABASE_ANON_KEY'];
if (supabaseKey && supabaseKey.startsWith('eyJ')) {
  console.log('   ✅ SUPABASE_ANON_KEY の形式が正しいです（JWT形式）');
} else if (supabaseKey) {
  console.error('   ❌ SUPABASE_ANON_KEY の形式が正しくありません（JWT形式である必要があります）');
  hasErrors = true;
}

// Gemini API Key の形式チェック
const geminiKey = envVars['GOOGLE_GENERATIVE_AI_API_KEY'];
if (geminiKey && geminiKey.startsWith('AIzaSy')) {
  console.log('   ✅ GOOGLE_GENERATIVE_AI_API_KEY の形式が正しいです');
} else if (geminiKey) {
  console.warn('   ⚠️  GOOGLE_GENERATIVE_AI_API_KEY の形式が通常と異なります');
  hasWarnings = true;
}

// 結果の表示
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('\n❌ エラーが見つかりました！');
  console.log('   .env.local ファイルを修正してください。\n');
  console.log('📚 セットアップガイド: /Users/keikei/dev/CoachingAI/SETUP_GUIDE.md');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('\n⚠️  警告がありますが、続行可能です。');
  console.log('   必要に応じて .env.local を確認してください。\n');
  process.exit(0);
} else {
  console.log('\n✅ すべての環境変数が正しく設定されています！');
  console.log('   yarn dev でアプリケーションを起動できます。\n');
  process.exit(0);
}

