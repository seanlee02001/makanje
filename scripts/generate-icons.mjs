import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/icons')

// MakanJe logo: orange rounded square + white fork & knife
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Background -->
  <rect width="512" height="512" rx="110" fill="#F97316"/>

  <!-- Fork (left) — 3 tines + stem -->
  <rect x="168" y="120" width="16" height="100" rx="8" fill="white"/>
  <rect x="198" y="120" width="16" height="100" rx="8" fill="white"/>
  <rect x="228" y="120" width="16" height="100" rx="8" fill="white"/>
  <!-- Fork neck curves down to stem -->
  <path d="M168 220 Q168 270 205 270 Q242 270 242 220" fill="#F97316"/>
  <path d="M168 240 Q168 280 205 280 Q242 280 242 240" stroke="none" fill="none"/>
  <rect x="197" y="255" width="22" height="140" rx="11" fill="white"/>
  <!-- Arch joining tines -->
  <path d="M168 220 C168 258 242 258 242 220" fill="white"/>

  <!-- Knife (right) -->
  <!-- Blade: left edge straight, right edge curves -->
  <path d="M292 120 L292 235 Q310 238 328 220 Q345 200 345 160 Q345 135 328 120 Z" fill="white"/>
  <!-- Guard line -->
  <rect x="284" y="235" width="22" height="8" rx="4" fill="white"/>
  <!-- Handle -->
  <rect x="284" y="243" width="22" height="152" rx="11" fill="white"/>
</svg>`

const buf = Buffer.from(svg)

await sharp(buf).resize(512, 512).png().toFile(join(outDir, 'icon-512.png'))
console.log('✓ icon-512.png')

await sharp(buf).resize(192, 192).png().toFile(join(outDir, 'icon-192.png'))
console.log('✓ icon-192.png')

console.log('Icons generated.')
