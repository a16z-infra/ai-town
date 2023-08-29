import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Unfonts from "unplugin-fonts/vite"
import autoprefixer from "autoprefixer"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // TODO: This doesn't seem to work.
    // Unfonts({
    //     custom: {
    //         families: [
    //             {
    //                 name: "Upheaval Pro",
    //                 src: "./assets/fonts/upheaval_pro.ttf",
    //             },
    //             {
    //                 name: "VCR OSD Mono",
    //                 src: "./assets/fonts/vcr_osd_mono.ttf",
    //             }
    //         ]
    //     }
    // })
  ],
  // TODO: autoprefixer and tailwind don't seem to work together?
//   css: {
//     postcss: {
//         plugins: [
//               autoprefixer({})
//         ]
//     },
//   }
})
