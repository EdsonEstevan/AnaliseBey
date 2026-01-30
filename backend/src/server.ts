import { env } from './config/env';
import { app } from './app';

app.listen(env.port, () => {
  console.log(`API disponível na porta ${env.port}`);
});
