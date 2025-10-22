#!/usr/bin/env node

/**
 * Supabase接続テストスクリプト
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// ES Modules用の__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境変数を読み込み
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local ファイルが見つかりません');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    envVars[key.trim()] = value.trim();
  }
});

const SUPABASE_URL = envVars['SUPABASE_URL'];
const SUPABASE_ANON_KEY = envVars['SUPABASE_ANON_KEY'];

console.log('🔍 Supabase接続テストを開始...\n');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

// HTTPSリクエストを使用してテスト

// テスト1: APIエンドポイントの確認
console.log('テスト1: APIエンドポイントの確認');
const apiUrl = new URL('/rest/v1/', SUPABASE_URL);

const options = {
  hostname: apiUrl.hostname,
  port: 443,
  path: apiUrl.pathname,
  method: 'GET',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  }
};

const req = https.request(options, (res) => {
  console.log(`   ステータスコード: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    console.log('   ✅ API接続成功\n');
  } else {
    console.log('   ⚠️  API接続に問題がある可能性があります\n');
  }

  // テーブルの存在確認
  console.log('テスト2: usersテーブルの存在確認');
  const tableCheckUrl = new URL('/rest/v1/users?limit=0', SUPABASE_URL);
  
  const tableOptions = {
    hostname: tableCheckUrl.hostname,
    port: 443,
    path: tableCheckUrl.pathname + tableCheckUrl.search,
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  };

  const tableReq = https.request(tableOptions, (tableRes) => {
    console.log(`   ステータスコード: ${tableRes.statusCode}`);
    
    let data = '';
    tableRes.on('data', (chunk) => {
      data += chunk;
    });

    tableRes.on('end', () => {
      if (tableRes.statusCode === 200) {
        console.log('   ✅ usersテーブルが存在します\n');
        console.log('🎉 すべてのテストに合格しました！');
      } else if (tableRes.statusCode === 404 || tableRes.statusCode === 406) {
        console.log('   ❌ usersテーブルが存在しません\n');
        console.log('📋 対処方法:');
        console.log('   1. Supabaseダッシュボードにアクセス');
        console.log('   2. SQL Editorでマイグレーションを実行');
        console.log('   3. 詳細は MIGRATION_GUIDE.md を参照\n');
      } else {
        console.log(`   ❌ エラー: ${data}\n`);
      }
    });
  });

  tableReq.on('error', (e) => {
    console.error(`   ❌ エラー: ${e.message}\n`);
  });

  tableReq.end();
});

req.on('error', (e) => {
  console.error(`❌ 接続エラー: ${e.message}`);
  console.log('\n考えられる原因:');
  console.log('   1. SUPABASE_URL が正しくない');
  console.log('   2. インターネット接続の問題');
  console.log('   3. Supabaseプロジェクトが存在しない\n');
  process.exit(1);
});

req.end();

