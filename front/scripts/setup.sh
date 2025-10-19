#!/bin/bash

# CoachingAI セットアップスクリプト
# このスクリプトは初回セットアップを支援します

set -e

echo "🚀 CoachingAI セットアップを開始します..."
echo ""

# カラーコード
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# プロジェクトディレクトリに移動
cd "$(dirname "$0")/.."

echo "📂 現在のディレクトリ: $(pwd)"
echo ""

# ステップ1: .env.local の確認と作成
echo "ステップ 1/5: 環境変数ファイルの確認"
echo "----------------------------------------"

if [ -f ".env.local" ]; then
  echo -e "${YELLOW}⚠️  .env.local ファイルが既に存在します${NC}"
  read -p "上書きしますか？ (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "既存の .env.local を使用します"
  else
    cp .env.example .env.local
    echo -e "${GREEN}✅ .env.local を作成しました${NC}"
    echo ""
    echo -e "${BLUE}📝 次に .env.local ファイルを編集して、実際のAPIキーを設定してください：${NC}"
    echo ""
    echo "   必須の環境変数:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - GOOGLE_GENERATIVE_AI_API_KEY"
    echo "   - CARTESIA_API_KEY"
    echo ""
    echo "   詳細は SETUP_GUIDE.md を参照してください"
    echo ""
    read -p "エディタで .env.local を開きますか？ (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      if command -v code &> /dev/null; then
        code .env.local
      elif command -v vim &> /dev/null; then
        vim .env.local
      else
        nano .env.local
      fi
    fi
  fi
else
  cp .env.example .env.local
  echo -e "${GREEN}✅ .env.local を作成しました${NC}"
  echo ""
  echo -e "${BLUE}📝 次に .env.local ファイルを編集して、実際のAPIキーを設定してください${NC}"
  echo ""
  read -p "エディタで .env.local を開きますか？ (y/N): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v code &> /dev/null; then
      code .env.local
    elif command -v vim &> /dev/null; then
      vim .env.local
    else
      nano .env.local
    fi
  fi
fi

echo ""

# ステップ2: Node.js のバージョン確認
echo "ステップ 2/5: Node.js のバージョン確認"
echo "----------------------------------------"

if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}✅ Node.js がインストールされています: $NODE_VERSION${NC}"
  
  # Node.js 18以上を推奨
  MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
  if [ "$MAJOR_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Node.js 18以上を推奨します（現在: $NODE_VERSION）${NC}"
  fi
else
  echo -e "${RED}❌ Node.js がインストールされていません${NC}"
  echo "   https://nodejs.org/ からインストールしてください"
  exit 1
fi

echo ""

# ステップ3: Yarn のインストール確認
echo "ステップ 3/5: Yarn のインストール確認"
echo "----------------------------------------"

if command -v yarn &> /dev/null; then
  YARN_VERSION=$(yarn -v)
  echo -e "${GREEN}✅ Yarn がインストールされています: v$YARN_VERSION${NC}"
else
  echo -e "${YELLOW}⚠️  Yarn がインストールされていません${NC}"
  read -p "Yarn をインストールしますか？ (y/N): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install -g yarn
    echo -e "${GREEN}✅ Yarn をインストールしました${NC}"
  else
    echo "npm を使用することもできます（yarn の代わりに npm を使用）"
  fi
fi

echo ""

# ステップ4: 依存関係のインストール
echo "ステップ 4/5: 依存関係のインストール"
echo "----------------------------------------"

if [ -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  node_modules が既に存在します${NC}"
  read -p "再インストールしますか？ (y/N): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf node_modules
    yarn install
    echo -e "${GREEN}✅ 依存関係をインストールしました${NC}"
  else
    echo "既存の node_modules を使用します"
  fi
else
  yarn install
  echo -e "${GREEN}✅ 依存関係をインストールしました${NC}"
fi

echo ""

# ステップ5: 環境変数のチェック
echo "ステップ 5/5: 環境変数のチェック"
echo "----------------------------------------"

if [ -f ".env.local" ]; then
  node scripts/check-env.js
else
  echo -e "${RED}❌ .env.local ファイルが見つかりません${NC}"
fi

echo ""
echo "=========================================="
echo ""
echo -e "${GREEN}🎉 セットアップが完了しました！${NC}"
echo ""
echo "次のステップ:"
echo ""
echo "1. Supabaseのセットアップ"
echo "   - https://supabase.com/ でプロジェクトを作成"
echo "   - データベースマイグレーションを実行"
echo "   - 詳細は SETUP_GUIDE.md を参照"
echo ""
echo "2. APIキーの取得"
echo "   - Google Gemini API: https://ai.google.dev/"
echo "   - Cartesia TTS API: https://cartesia.ai/"
echo ""
echo "3. アプリケーションの起動"
echo "   - yarn dev"
echo ""
echo "📚 詳細なガイド: /Users/keikei/dev/CoachingAI/SETUP_GUIDE.md"
echo ""

