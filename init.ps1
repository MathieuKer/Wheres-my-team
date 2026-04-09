npm create vite@latest app -- --template react-ts
Move-Item -Path "app\*" -Destination "." -Force
Move-Item -Path "app\.*" -Destination "." -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "app"
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @supabase/supabase-js @dnd-kit/core @dnd-kit/utilities react-zoom-pan-pinch lucide-react clsx tailwind-merge
