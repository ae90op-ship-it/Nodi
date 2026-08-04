import fs from 'fs';

let content = fs.readFileSync('src/components/GraphView.tsx', 'utf-8');

content = content.replace(
  /const onConnect = useCallback\(async \(params: Connection\) => \{/,
  `const isValidConnection = useCallback((connection: Connection) => {
    return connection.source !== connection.target;
  }, []);

  const onConnect = useCallback(async (params: Connection) => {`
);

fs.writeFileSync('src/components/GraphView.tsx', content);
