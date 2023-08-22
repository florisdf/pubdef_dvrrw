import { defineAppSetup } from '@slidev/types'
import { TroisJSVuePlugin } from 'troisjs';

export default defineAppSetup(({ app, router }) => {
  // Vue App
  app.use(TroisJSVuePlugin);
})
