import { nanoid } from 'nanoid';

export const ancestorMatchingPredicate = (element, predicate) => {
  if (predicate(element)) {
    return element;
  }
  if (!element.parentNode) {
    return null;
  }
  return ancestorMatchingPredicate(element.parentNode, predicate);
};

export const getNodeByPath = (path, node) => {
  if (path.length === 0) {
    return node;
  } else {
    const [nodeIndex, ...rest] = path;
    return getNodeByPath(rest, node.children[nodeIndex]);
  }
};

export function mapTree(node, fn) {
  const newNode = fn(node);

  if (node.children) {
    newNode.children = node.children.map((child) => mapTree(child, fn));
  }

  return newNode;
}

export function findNode(node, predicate, path = []) {
  if (predicate(node)) {
    return [node, path];
  }

  if (node.children) {
    for (let [index, child] of node.children.entries()) {
      const [found, childPath] = findNode(child, predicate, [...path, index]);
      if (found) {
        return [found, childPath];
      }
    }
  }

  return [null, []];
}

export function getNodeById(node, nodeId) {
  return findNode(node, ({ id }) => id === nodeId);
}

export const updateNodeByPath = (node, currentPath, callback) => {
  const newNode = { ...node };
  if (currentPath.length === 0) {
    return callback(newNode);
  } else {
    const [nodeIndex, ...rest] = currentPath;
    newNode.children = newNode.children
      .map((node, index) => {
        if (nodeIndex === index) {
          return updateNodeByPath(node, rest, callback);
        } else {
          return node;
        }
      })
      .filter((node) => node);
    return newNode;
  }
};

export const newNode = () => {
  return { data: '', children: [], id: nanoid() };
};

export function getParentNode(currentNode, targetNode) {
  if (currentNode.id === targetNode.id) {
    return currentNode;
  } else {
    if (currentNode.children) {
      for (let child of currentNode.children) {
        if (child.id === targetNode.id) {
          return currentNode;
        } else {
          const found = getParentNode(child, targetNode);
          if (found) {
            return found;
          }
        }
      }
    }
    return null;
  }
}
