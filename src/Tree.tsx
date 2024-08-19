import { useCallback, useState, useMemo } from 'preact/hooks';
import { useKeyboardEvent } from '@react-hookz/web';
import { nanoid } from 'nanoid';

import Nodes from './Nodes';
import {
  mapTree,
  getNodeById,
  updateNodeById,
  newNode,
  getParentNode,
} from './utils';

export default function Tree({ nodes: initialNodes }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [edit, setEdit] = useState(false);
  const [nodes, setNodes] = useState(() => {
    const result = JSON.parse(JSON.stringify(initialNodes));
    return mapTree(result[0], (node) => ({ ...node, id: nanoid() }));
  });

  const selectedNode = useMemo(
    () => getNodeById(nodes, selectedNodeId),
    [selectedNodeId, nodes]
  );

  const parentNode = useMemo(
    () => (selectedNodeId ? getParentNode(nodes, selectedNodeId) : nodes),
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

  const updateNode = useCallback((nodeIdToUpdate, callback) => {
    setNodes((prevTree) => {
      return updateNodeById(prevTree, nodeIdToUpdate, callback);
    });
  }, []);

  const deleteNode = useCallback((nodeId) => {
    return updateNode(nodeId, (prevNode) => {
      return null;
    });
  }, []);

  const insertNodeAfter = useCallback((targetNodeId, nodeToInsert) => {
    setNodes((prevTree) => {
      const parentNode = getParentNode(prevTree, targetNodeId);
      const insertionIndex = parentNode.children.findIndex(
        ({ id }) => id === targetNodeId
      );
      return updateNodeById(prevTree, parentNode.id, (prevNode) => ({
        ...prevNode,
        children: [
          ...prevNode.children.slice(0, insertionIndex + 1),
          nodeToInsert,
          ...prevNode.children.slice(insertionIndex + 1),
        ],
      }));
    });
  }, []);

  const insertNodeBefore = useCallback((targetNodeId, nodeToInsert) => {
    setNodes((prevTree) => {
      const parentNode = getParentNode(prevTree, targetNodeId);
      const insertionIndex = parentNode.children.findIndex(
        ({ id }) => id === targetNodeId
      );
      return updateNodeById(prevTree, parentNode.id, (prevNode) => ({
        ...prevNode,
        children: [
          ...prevNode.children.slice(0, insertionIndex),
          nodeToInsert,
          ...prevNode.children.slice(insertionIndex),
        ],
      }));
    });
  }, []);

  const addChild = useCallback((targetNodeId, nodeToInsert) => {
    setNodes((prevTree) => {
      const parentNode = getNodeById(prevTree, targetNodeId);

      return updateNodeById(prevTree, parentNode.id, (prevNode) => {
        const newChildren = [...(prevNode.children || []), nodeToInsert];
        return {
          ...prevNode,
          children: newChildren,
        };
      });
    });
  }, []);

  const setNodeOpen = useCallback((nodeId, value) => {
    return updateNode(nodeId, (prevNode) => {
      return {
        ...prevNode,
        open: value,
      };
    });
  }, []);

  const moveNode = useCallback(
    async (sourceNodeId, nodeId, position) => {
      const nodeToMove = getNodeById(nodes, sourceNodeId);
      deleteNode(sourceNodeId);

      if (position === 'after') {
        insertNodeAfter(nodeId, nodeToMove);
      }
      if (position === 'before') {
        insertNodeBefore(nodeId, nodeToMove);
      }
      if (position === 'addChild') {
        addChild(nodeId, nodeToMove);
        setNodeOpen(nodeId, true); // Open the current node
      }

      setSelectedNodeId(nodeToMove.id);
    },
    [
      deleteNode,
      insertNodeAfter,
      insertNodeBefore,
      addChild,
      setSelectedNodeId,
      setNodeOpen,
      nodes,
    ]
  );

  useKeyboardEvent(
    true,
    async (ev) => {
      let handled = false;
      let nodeToAdd, currentlySelectedIndex;
      switch (ev.key) {
        case 'ArrowRight':
          if (selectedNode.children?.length) {
            setNodeOpen(selectedNodeId, true);
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
          insertNodeAfter(selectedNodeId, nodeToAdd);
          onSelect(nodeToAdd.id);
          setEdit(true);

          handled = true;
          break;
        case 'Insert':
          nodeToAdd = newNode();
          addChild(selectedNodeId, nodeToAdd);

          setNodeOpen(selectedNodeId, true); // Open the current node
          onSelect(nodeToAdd.id);
          setEdit(true);

          handled = true;
          break;

        case 'Delete':
          currentlySelectedIndex = parentNode.children.findIndex(
            ({ id }) => id === selectedNodeId
          );
          deleteNode(selectedNodeId);

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
      selectedNodeId,
      moveNode,
      addChild,
      deleteNode,
      setNodeOpen,
      insertNodeAfter,
      onSelect,
    ]
  );

  return (
    <Nodes
      nodes={nodes.children}
      onSelect={onSelect}
      selectedNodeId={selectedNodeId}
      updateNode={updateNode}
      edit={edit}
      setEdit={setEdit}
      moveNode={moveNode}
    />
  );
}
