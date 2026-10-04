function isolatedProject() {
  const env = process.env;
  const required = ['SUPABASE_TEST_URL', 'SUPABASE_TEST_ANON_KEY', 'SUPABASE_TEST_SERVICE_ROLE_KEY', 'SUPABASE_TEST_PROJECT_REF'];
  if (required.some((name) => !env[name]) || env.SUPABASE_TEST_ALLOW_DESTRUCTIVE !== 'isolated-test-only') throw new Error('UNVERIFIED: isolated test-project credentials and acknowledgement required.');
  const url = new URL(env.SUPABASE_TEST_URL);
  if (url.hostname !== `${env.SUPABASE_TEST_PROJECT_REF}.supabase.co` && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Test URL must match the acknowledged isolated project reference.');
  return { url: url.href, publicKey: env.SUPABASE_TEST_ANON_KEY, serviceKey: env.SUPABASE_TEST_SERVICE_ROLE_KEY };
}
module.exports = { isolatedProject };
