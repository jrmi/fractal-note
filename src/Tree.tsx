import { useCallback, useState, useMemo } from 'preact/hooks';
import { useKeyboardEvent } from '@react-hookz/web';
import Nodes from './Nodes';
import {
  getNodeByPath,
  mapTree,
  getNodeById,
  updateNodeByPath,
  newNode,
} from './utils';
import useAsyncState from './useAsyncState';
import { nanoid } from 'nanoid';

export default function Tree({ nodes: initialNodes }) {
  const [selectedPath, setSelectedPath] = useState([]);
  const [edit, setEdit] = useState(false);
  const [nodes, setNodes] = useAsyncState(() => {
    const result = JSON.parse(JSON.stringify(initialNodes));
    return mapTree(result[0], (node) => ({ ...node, id: nanoid() }));
  });

  const selectedNode = useMemo(
    () => getNodeByPath(selectedPath, nodes),
    [selectedPath.join('.'), nodes]
  );

  const parentNode = useMemo(
    () => getNodeByPath(selectedPath.slice(0, -1), nodes),
    [selectedPath.join('.'), nodes]
  );

  const onSelect = useCallback(
    (path) => {
      if (path.join('.') !== selectedPath.join('.')) {
        setEdit(false);
        setSelectedPath(path);
      }
    },
    [selectedPath]
  );

  const updateNode = useCallback((path, callback) => {
    return setNodes((prev) => {
      return updateNodeByPath(prev, path, callback);
    });
  }, []);

  const deleteNode = useCallback((atPath) => {
    return updateNode(atPath, (prevNode) => {
      return null;
    });
  }, []);

  const insertNodeAfter = useCallback((destPath, node) => {
    const insertionIndex = destPath.at(-1);
    return updateNode(destPath.slice(0, -1), (prevNode) => ({
      ...prevNode,
      children: [
        ...prevNode.children.slice(0, insertionIndex + 1),
        node,
        ...prevNode.children.slice(insertionIndex + 1),
      ],
    }));
  }, []);

  const insertNodeBefore = useCallback((destPath, node) => {
    const insertionIndex = destPath.at(-1);
    return updateNode(destPath.slice(0, -1), (prevNode) => ({
      ...prevNode,
      children: [
        ...prevNode.children.slice(0, insertionIndex),
        node,
        ...prevNode.children.slice(insertionIndex),
      ],
    }));
  }, []);

  const addChild = useCallback((parentPath, node) => {
    return updateNode(parentPath, (prevNode) => {
      const newChildren = [...(prevNode.children || []), node];
      return {
        ...prevNode,
        children: newChildren,
      };
    });
  }, []);

  const setNodeOpen = useCallback((path, value) => {
    return updateNode(path, (prevNode) => {
      return {
        ...prevNode,
        open: value,
      };
    });
  }, []);

  const moveNode = useCallback(
    async (sourcePath, nodeId, position) => {
      const nodeToMove = getNodeByPath(sourcePath, nodes);
      let newNodes = await deleteNode(sourcePath);
      setSelectedPath([]);

      const [, destPath] = getNodeById(newNodes, nodeId);

      if (position === 'after') {
        newNodes = await insertNodeAfter(destPath, nodeToMove);
      }
      if (position === 'before') {
        newNodes = await insertNodeBefore(destPath, nodeToMove);
      }
      if (position === 'addChild') {
        newNodes = await addChild(destPath, nodeToMove);
        setNodeOpen(destPath, true); // Open the current node
      }

      const [, movedNodePath] = getNodeById(newNodes, nodeToMove.id);

      setSelectedPath(movedNodePath);
    },
    [
      deleteNode,
      insertNodeAfter,
      insertNodeBefore,
      addChild,
      nodes,
      setSelectedPath,
    ]
  );

  useKeyboardEvent(
    true,
    async (ev) => {
      let handled = false;
      let nodeToAdd, newNodes;
      switch (ev.key) {
        case 'ArrowRight':
          if (selectedNode.children) {
            onSelect([...selectedPath, 0]);
          }
          // TODO save last selected child to come back to it
          handled = true;
          break;
        case 'ArrowLeft':
          onSelect(selectedPath.slice(0, -1));
          handled = true;
          break;
        case 'ArrowDown':
          if (selectedPath.at(-1) < parentNode.children.length - 1) {
            onSelect(selectedPath.with(-1, selectedPath.at(-1) + 1));
          } else {
            // TODO jump on next available node if any
          }
          handled = true;
          break;
        case 'ArrowUp':
          if (ev.ctrlKey) {
            //moveNode(selectedPath,)
          } else {
            if (selectedPath.at(-1) > 0) {
              onSelect(selectedPath.with(-1, selectedPath.at(-1) - 1));
            } else {
              // TODO jump on next previous node if any
            }
          }
          handled = true;
          break;
        case 'Enter':
          nodeToAdd = newNode();
          newNodes = await insertNodeAfter(selectedPath, nodeToAdd);
          const [, appendedNodePath] = getNodeById(newNodes, nodeToAdd.id);
          setSelectedPath(appendedNodePath);
          setEdit(true);

          handled = true;
          break;
        case 'Insert':
          nodeToAdd = newNode();
          newNodes = await addChild(selectedPath, nodeToAdd);
          const [, insertedNodePath] = getNodeById(newNodes, nodeToAdd.id);

          setNodeOpen(selectedPath, true); // Open the current node
          setSelectedPath(insertedNodePath);
          setEdit(true);

          handled = true;
          break;

        case 'Delete':
          newNodes = await deleteNode(selectedPath);

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
    [
      selectedNode,
      parentNode,
      selectedPath,
      moveNode,
      addChild,
      deleteNode,
      setNodeOpen,
      insertNodeAfter,
    ]
  );

  return (
    <Nodes
      nodes={nodes.children}
      onSelect={onSelect}
      selectedPath={selectedPath}
      updateNode={updateNode}
      edit={edit}
      setEdit={setEdit}
      moveNode={moveNode}
    />
  );
}
