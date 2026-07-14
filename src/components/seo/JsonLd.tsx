// Server component that injects a JSON-LD <script> tag. Offline-safe: the data
// is passed in as a plain object (no external fetch). React escapes the JSON
// content into a script of type application/ld+json.
export function JsonLd({data}: {data: Record<string, unknown>}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: JSON.stringify(data).replace(/</g, '\\u003c')}}
    />
  );
}
