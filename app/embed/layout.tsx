export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-transparent">
      <body className="bg-transparent min-h-screen">
        {children}
      </body>
    </html>
  );
}