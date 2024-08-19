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
  getPreviousNextNode,
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
    async (nodeIdToMove, targetNodeId, position) => {
      const nodeToMove = getNodeById(nodes, nodeIdToMove);
      deleteNode(nodeIdToMove);

      if (position === 'after') {
        insertNodeAfter(targetNodeId, nodeToMove);
      }
      if (position === 'before') {
        insertNodeBefore(targetNodeId, nodeToMove);
      }
      if (position === 'addChild') {
        addChild(targetNodeId, nodeToMove);
        setNodeOpen(targetNodeId, true); // Open the current node
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
          if (ev.ctrlKey) {
            const [previousNode, nextNode] = getPreviousNextNode(
              nodes,
              selectedNodeId
            );
            if (previousNode) {
              moveNode(selectedNodeId, previousNode.id, 'addChild');
            } else if (nextNode) {
              moveNode(selectedNodeId, nextNode.id, 'addChild');
            }
          } else {
            if (selectedNode.children?.length) {
              setNodeOpen(selectedNodeId, true);
              onSelect(selectedNode.children[0].id);
            }
          }
          // TODO save last selected child to come back to it
          handled = true;
          break;
        case 'ArrowLeft':
          if (ev.ctrlKey) {
            moveNode(selectedNodeId, parentNode.id, 'after');
          } else {
            onSelect(parentNode.id);
          }
          handled = true;
          break;
        case 'ArrowDown':
          currentlySelectedIndex = parentNode.children.findIndex(
            ({ id }) => id === selectedNodeId
          );
          if (ev.ctrlKey) {
            if (currentlySelectedIndex < parentNode.children.length - 1) {
              moveNode(
                selectedNodeId,
                parentNode.children[currentlySelectedIndex + 1].id,
                'after'
              );
            }
          } else {
            if (currentlySelectedIndex < parentNode.children.length - 1) {
              onSelect(parentNode.children[currentlySelectedIndex + 1].id);
            } else {
              const [, nextNode] = getPreviousNextNode(nodes, parentNode.id);
              if (nextNode) {
                if (nextNode.children.length > 0) {
                  onSelect(nextNode.children[0].id);
                  setNodeOpen(nextNode.id, true);
                } else {
                  onSelect(nextNode.id);
                }
              }
            }
          }
          handled = true;
          break;
        case 'ArrowUp':
          currentlySelectedIndex = parentNode.children.findIndex(
            ({ id }) => id === selectedNodeId
          );
          if (ev.ctrlKey) {
            if (currentlySelectedIndex > 0) {
              moveNode(
                selectedNodeId,
                parentNode.children[currentlySelectedIndex - 1].id,
                'before'
              );
            }
          } else {
            if (currentlySelectedIndex > 0) {
              onSelect(parentNode.children[currentlySelectedIndex - 1].id);
            } else {
              const [previousNode] = getPreviousNextNode(nodes, parentNode.id);
              if (previousNode) {
                if (previousNode.children.length > 0) {
                  onSelect(previousNode.children.at(-1).id);
                  setNodeOpen(previousNode.id, true);
                } else {
                  onSelect(previousNode.id);
                }
              }
            }
          }
          handled = true;
          break;
        case 'Enter':
          nodeToAdd = newNode();
          if (ev.shiftKey) {
            insertNodeBefore(selectedNodeId, nodeToAdd);
          } else {
            insertNodeAfter(selectedNodeId, nodeToAdd);
          }
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
