import Nodes from './Nodes';
import { useCallback, useState, useMemo } from 'preact/hooks';
import { useKeyboardEvent } from '@react-hookz/web';

const getNodeByPath = (path, currentNode) => {
  if (path.length === 0) {
    return currentNode;
  } else {
    const [nodeIndex, ...rest] = path;
    return getNodeByPath(rest, currentNode.children[nodeIndex]);
  }
};

export default function Tree({ nodes: initialNodes }) {
  const [selectedPath, setSelectedPath] = useState([]);
  const [edit, setEdit] = useState(false);
  const [nodes, setNodes] = useState(() =>
    JSON.parse(JSON.stringify(initialNodes))
  );

  const selectedNode = useMemo(
    () => getNodeByPath(selectedPath, nodes[0]),
    [selectedPath.join('.'), nodes]
  );

  const parentNode = useMemo(
    () => getNodeByPath(selectedPath.slice(0, -1), nodes[0]),
    [selectedPath.join('.'), nodes]
  );

  const onSelect = useCallback(
    (path) => {
      if (path.join('.') !== selectedPath.join('.')) {
        console.log('open', path);
        setEdit(false);
        setSelectedPath(path);
      }
    },
    [selectedPath]
  );

  const updateNode = useCallback((path, callback) => {
    setNodes((prev) => {
      const updateRecursive = (currentPath, node) => {
        const newNode = { ...node };
        if (currentPath.length === 0) {
          return callback(newNode);
        } else {
          const [nodeIndex, ...rest] = currentPath;
          newNode.children = newNode.children
            .map((node, index) => {
              if (nodeIndex === index) {
                return updateRecursive(rest, node);
              } else {
                return node;
              }
            })
            .filter((node) => node);
          return newNode;
        }
      };
      return [updateRecursive(path, prev[0])];
    });
  }, []);

  useKeyboardEvent(
    true,
    (ev) => {
      let handled = false;
      switch (ev.key) {
        case 'ArrowRight':
          if (selectedNode.children) {
            onSelect([...selectedPath, 0]);
          }
          handled = true;
          break;
        case 'ArrowLeft':
          onSelect(selectedPath.slice(0, -1));
          handled = true;
          break;
        case 'ArrowDown':
          if (selectedPath.at(-1) < parentNode.children.length) {
            onSelect(selectedPath.with(-1, selectedPath.at(-1) + 1));
          }
          handled = true;
          break;
        case 'ArrowUp':
          if (selectedPath.at(-1) > 0) {
            onSelect(selectedPath.with(-1, selectedPath.at(-1) - 1));
          }
          handled = true;
          break;
        case 'Enter':
          const insertionIndex = selectedPath.at(-1);
          updateNode(selectedPath.slice(0, -1), (prevNode) => ({
            ...prevNode,
            children: [
              ...prevNode.children.slice(0, insertionIndex + 1),
              { data: '', children: [] },
              ...prevNode.children.slice(insertionIndex + 1),
            ],
          }));
          setSelectedPath([...selectedPath.slice(0, -1), insertionIndex + 1]);
          setEdit(true);

          handled = true;
          break;
        case 'Insert':
          updateNode(selectedPath, (prevNode) => {
            const newChildren = [
              ...(prevNode.children || []),
              { data: '', children: [] },
            ];
            return {
              ...prevNode,
              children: newChildren,
              open: true,
            };
          });

          setSelectedPath([...selectedPath, selectedNode.children.length]);
          setEdit(true);

          handled = true;
          break;

        case 'Delete':
          updateNode(selectedPath, (prevNode) => {
            return null;
          });
          const removedIndex = selectedPath.at(-1);
          if (removedIndex > 0) {
            setSelectedPath([...selectedPath.slice(0, -1), removedIndex - 1]);
          } else {
            setSelectedPath(selectedPath.slice(0, -1));
          }
          setEdit(false);

          handled = true;
          break;
        case 'e':
        case 'F2':
        case ' ':
          handled = true;
          break;
      }
      if (handled) {
        ev.preventDefault();
      } else {
        console.log(ev);
      }
    },
    [selectedNode, parentNode, selectedPath]
  );

  return (
    <Nodes
      nodes={nodes[0].children}
      onSelect={onSelect}
      selectedPath={selectedPath}
      updateNode={updateNode}
      edit={edit}
      setEdit={setEdit}
    />
  );
}

{
}
