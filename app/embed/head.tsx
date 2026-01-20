export default function Head() {
  return (
    <>
      <title>Spin to Win Widget</title>
      <meta name="description" content="Interactive spin wheel widget" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Prevent any external fonts from root layout */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * {
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
        `
      }} />
    </>
  );
}