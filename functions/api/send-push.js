export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { subscription, title, body: msgBody, url } = body;

    if (!subscription || !subscription.endpoint) {
      return new Response(JSON.stringify({ error: 'Missing subscription' }), { status: 400 });
    }

    const webpush = await import('https://esm.sh/web-push@3.6.7');
    webpush.setVapidDetails(
      'mailto:bachamalakand1985@gmail.com',
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );

    const payload = JSON.stringify({
      title: title || 'SayyaraDrive',
      body: msgBody || '',
      url: url || '/'
    });

    await webpush.sendNotification(subscription, payload);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
