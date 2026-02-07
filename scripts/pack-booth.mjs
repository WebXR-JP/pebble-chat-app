/**
 * Booth アップロード用に dist/ のインストーラーを zip に圧縮するスクリプト
 * 使い方: npm run pack:booth
 */
import { readFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execSync } from 'node:child_process'

const rootDir = resolve(import.meta.dirname, '..')
const distDir = join(rootDir, 'dist')
const boothDir = join(distDir, 'booth')
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'))
const version = pkg.version
const name = pkg.productName || 'PebbleChat'

// zip にするターゲット: [元ファイル名, 出力 zip 名]
const targets = [
  [`${name}-${version}-arm64.dmg`, `${name}-${version}-mac-arm64.zip`],
  [`${name}-${version}.dmg`, `${name}-${version}-mac-x64.zip`],
  [`${name} Setup ${version}.exe`, `${name}-${version}-win-x64.zip`],
]

if (!existsSync(distDir)) {
  console.error('dist/ ディレクトリが見つかりません。先にビルドを実行してください。')
  process.exit(1)
}

// booth/ ディレクトリを作り直す
if (existsSync(boothDir)) {
  rmSync(boothDir, { recursive: true })
}
mkdirSync(boothDir, { recursive: true })

console.log(`\nBooth 用 zip を作成します (v${version})\n`)

let count = 0
for (const [srcFile, zipName] of targets) {
  const srcPath = join(distDir, srcFile)
  if (!existsSync(srcPath)) {
    console.log(`  [skip] ${srcFile} が見つかりません`)
    continue
  }

  const zipPath = join(boothDir, zipName)
  execSync(`cd "${distDir}" && zip -j -q "${zipPath}" "${srcFile}"`)
  console.log(`  -> ${zipName}`)
  count++
}

if (count === 0) {
  console.error('\nzip にできるファイルが見つかりませんでした。ビルドを実行してください。')
  process.exit(1)
}

console.log(`\n${count} ファイルを dist/booth/ に作成しました。`)
