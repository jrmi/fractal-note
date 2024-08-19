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

export function mapTree(tree, fn) {
  const newNode = fn(tree);

  if (tree.children) {
    newNode.children = tree.children.map((child) => mapTree(child, fn));
  }

  return newNode;
}

export function findNode(tree, predicate, path = []) {
  if (predicate(tree)) {
    return [tree, path];
  }

  if (tree.children) {
    for (let [index, child] of tree.children.entries()) {
      const [found, childPath] = findNode(child, predicate, [...path, index]);
      if (found) {
        return [found, childPath];
      }
    }
  }

  return [null, []];
}

export function getNodeById(tree, nodeId) {
  return findNode(tree, ({ id }) => id === nodeId)[0];
}

export const updateNodeById = (tree, nodeId, callback) => {
  const path = findNode(tree, ({ id }) => id === nodeId)[1];
  return updateNodeByPath(tree, path, callback);
};

export const updateNodeByPath = (tree, currentPath, callback) => {
  const newNode = { ...tree };
  if (currentPath.length === 0) {
    return callback(newNode);
  } else {
    const [nodeIndex, ...rest] = currentPath;
    newNode.children = newNode.children
      .map((child, index) => {
        if (nodeIndex === index) {
          return updateNodeByPath(child, rest, callback);
        } else {
          return child;
        }
      })
      .filter((child) => Boolean(child));
    return newNode;
  }
};

export const newNode = () => {
  return { data: '', children: [], id: nanoid() };
};

export function getParentNode(tree, childNodeId) {
  if (tree.id === childNodeId) {
    return tree;
  } else {
    if (tree.children) {
      for (let child of tree.children) {
        if (child.id === childNodeId) {
          return tree;
        } else {
          const found = getParentNode(child, childNodeId);
          if (found) {
            return found;
          }
        }
      }
    }
    return null;
  }
}
