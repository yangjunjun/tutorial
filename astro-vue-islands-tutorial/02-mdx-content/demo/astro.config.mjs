import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// MDX 集成配置
// https://docs.astro.build/en/guides/integrations-guide/mdx/
export default defineConfig({
  integrations: [mdx()],
});
