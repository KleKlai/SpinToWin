export const metadata = {
  title: 'Spin to Win Widget',
  description: 'Interactive spin wheel widget',
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <head>
        {/* Override any font styles from root layout */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
          `
        }} />
      </head>
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>
          <main suppressHydrationWarning style={{
            width: '100%',
            height: '100%',
            minHeight: '100vh',
            margin: 0,
            padding: 0
          }}>
            {children}
          </main>
        </body>
      </html>
    </>
  );
}