import app from './app.js';
import { environment } from './config/environment.js';

app.listen(environment.port, () => {
  console.log(`ERP Real API server running on port ${environment.port}`);
});