import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

// Vue 3 集成配置
// https://docs.astro.build/en/guides/integrations-guide/vue/
export default defineConfig({
  integrations: [vue()],
});
