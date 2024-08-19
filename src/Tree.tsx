import { useCallback, useState, useMemo } from 'preact/hooks';
import { useKeyboardEvent } from '@react-hookz/web';
import Nodes from './Nodes';
import {
  getNodeByPath,
  mapTree,
  getNodeById,
  updateNodeByPath,
  newNode,
  getParentNode,
} from './utils';
import useAsyncState from './useAsyncState';
import { nanoid } from 'nanoid';

export default function Tree({ nodes: initialNodes }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [edit, setEdit] = useState(false);
  const [nodes, setNodes] = useAsyncState(() => {
    const result = JSON.parse(JSON.stringify(initialNodes));
    return mapTree(result[0], (node) => ({ ...node, id: nanoid() }));
  });

  const [selectedNode, selectedPath] = useMemo(
    () => getNodeById(nodes, selectedNodeId),
    [selectedNodeId, nodes]
  );

  const parentNode = useMemo(
    () => (selectedNode ? getParentNode(nodes, selectedNode) : null),
    [selectedNodeId, nodes]
  );

  const onSelect = useCallback(
    (newNodeId) => {
      if (newNodeId !== selectedNodeId) {
        setEdit(false);
        setSelectedNodeId(newNodeId);
      }
    },
    [selectedNodeId]
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
      setSelectedNodeId(null);

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

      setSelectedNodeId(nodeToMove.id);
    },
    [
      deleteNode,
      insertNodeAfter,
      insertNodeBefore,
      addChild,
      nodes,
      setSelectedNodeId,
    ]
  );

  useKeyboardEvent(
    true,
    async (ev) => {
      let handled = false;
      let nodeToAdd, newNodes, currentlySelectedIndex;
      switch (ev.key) {
        case 'ArrowRight':
          if (selectedNode.children?.length) {
            onSelect(selectedNode.children[0].id);
          }
          // TODO save last selected child to come back to it
          handled = true;
          break;
        case 'ArrowLeft':
          onSelect(parentNode.id);
          handled = true;
          break;
        case 'ArrowDown':
          currentlySelectedIndex = parentNode.children.findIndex(
            ({ id }) => id === selectedNodeId
          );
          if (currentlySelectedIndex < parentNode.children.length - 1) {
            onSelect(parentNode.children[currentlySelectedIndex + 1].id);
          } else {
            // TODO jump on next available node if any
          }
          handled = true;
          break;
        case 'ArrowUp':
          if (ev.ctrlKey) {
            //moveNode(selectedPath,)
          } else {
            currentlySelectedIndex = parentNode.children.findIndex(
              ({ id }) => id === selectedNodeId
            );
            if (currentlySelectedIndex > 0) {
              onSelect(parentNode.children[currentlySelectedIndex - 1].id);
            } else {
              // TODO jump on next previous node if any
            }
          }
          handled = true;
          break;
        case 'Enter':
          nodeToAdd = newNode();
          newNodes = await insertNodeAfter(selectedPath, nodeToAdd);
          onSelect(nodeToAdd.id);
          setEdit(true);

          handled = true;
          break;
        case 'Insert':
          nodeToAdd = newNode();
          newNodes = await addChild(selectedPath, nodeToAdd);
          const [, insertedNodePath] = getNodeById(newNodes, nodeToAdd.id);

          setNodeOpen(selectedPath, true); // Open the current node
          onSelect(nodeToAdd.id);
          setEdit(true);

          handled = true;
          break;

        case 'Delete':
          currentlySelectedIndex = parentNode.children.findIndex(
            ({ id }) => id === selectedNodeId
          );
          newNodes = await deleteNode(selectedPath);

          if (currentlySelectedIndex > 0) {
            onSelect(parentNode.children[currentlySelectedIndex - 1].id);
          } else {
            onSelect(parentNode.id);
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
      selectedNodeId={selectedNodeId}
      updateNode={updateNode}
      edit={edit}
      setEdit={setEdit}
      moveNode={moveNode}
    />
  );
}
