#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 設定
const BOLT_PROJECT_ID = 'sb1-jsns8dmm';
const BOLT_URL = `https://bolt.new/~/${BOLT_PROJECT_ID}`;
const LP_DIR = path.join(__dirname, '../public/lp');
const BACKUP_DIR = path.join(__dirname, '../backups');

// ログ関数
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// バックアップ作成
function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `lp-backup-${timestamp}`);
  
  if (fs.existsSync(LP_DIR)) {
    execSync(`cp -r "${LP_DIR}" "${backupPath}"`);
    log(`Backup created: ${backupPath}`);
  }
}

// Boltプロジェクトの変更をチェック
async function checkBoltChanges() {
  try {
    log('Checking for Bolt project changes...');
    
    // 実際の実装では、BoltのAPIやWebhookを使用
    // 現在は手動同期のためのスケルトン
    
    const response = await fetch(BOLT_URL);
    const html = await response.text();
    
    // 簡単な変更検知（実際の実装ではより高度な方法を使用）
    const currentHash = require('crypto').createHash('md5').update(html).digest('hex');
    const hashFile = path.join(__dirname, '../.bolt-hash');
    
    let previousHash = '';
    if (fs.existsSync(hashFile)) {
      previousHash = fs.readFileSync(hashFile, 'utf8');
    }
    
    if (currentHash !== previousHash) {
      log('Changes detected in Bolt project');
      fs.writeFileSync(hashFile, currentHash);
      return true;
    } else {
      log('No changes detected');
      return false;
    }
  } catch (error) {
    log(`Error checking Bolt changes: ${error.message}`);
    return false;
  }
}

// Boltプロジェクトのエクスポート（手動プロセス）
function exportBoltProject() {
  log('Exporting Bolt project...');
  
  // 実際の実装では、BoltのエクスポートAPIを使用
  // 現在は手動エクスポートのガイドを表示
  
  console.log(`
=== Bolt Project Export Guide ===

1. Open Bolt project: ${BOLT_URL}
2. Click "Export" or "Download" button
3. Extract the downloaded files
4. Copy the contents to: ${LP_DIR}
5. Update asset paths in index.html

Manual export required until Bolt API is available.
  `);
}

// 自動同期メイン処理
async function syncBoltProject() {
  try {
    log('Starting Bolt project sync...');
    
    // バックアップ作成
    createBackup();
    
    // 変更チェック
    const hasChanges = await checkBoltChanges();
    
    if (hasChanges) {
      log('Changes detected, starting export process...');
      exportBoltProject();
      
      // Gitコミット
      try {
        execSync('git add public/lp/', { stdio: 'inherit' });
        execSync('git commit -m "feat: Update Bolt LP from sync script"', { stdio: 'inherit' });
        execSync('git push', { stdio: 'inherit' });
        log('Changes committed and pushed to GitHub');
      } catch (gitError) {
        log(`Git operation failed: ${gitError.message}`);
      }
    }
    
    log('Sync completed');
  } catch (error) {
    log(`Sync failed: ${error.message}`);
    process.exit(1);
  }
}

// コマンドライン引数処理
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'sync':
    syncBoltProject();
    break;
  case 'check':
    checkBoltChanges().then(hasChanges => {
      console.log(hasChanges ? 'Changes detected' : 'No changes');
    });
    break;
  case 'export':
    exportBoltProject();
    break;
  default:
    console.log(`
Bolt Sync Script

Usage:
  node scripts/sync-bolt.js sync    - Sync Bolt project
  node scripts/sync-bolt.js check   - Check for changes
  node scripts/sync-bolt.js export  - Show export guide

Note: Manual export required until Bolt API is available.
    `);
}
