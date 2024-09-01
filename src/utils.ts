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

export function getPreviousNextNode(tree, nodeId) {
  const parentNode = getParentNode(tree, nodeId);
  const childIndex = parentNode.children.findIndex(({ id }) => id === nodeId);
  const previous =
    childIndex === 0 ? null : parentNode.children[childIndex - 1];
  const next =
    childIndex === parentNode.children.length - 1
      ? null
      : parentNode.children[childIndex + 1];
  return [previous, next];
}

export function generateColors(seedValue) {
  // Seed the random number generator
  function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Generate random values for RGB components
  function randomWithSeed(seed) {
    return Math.floor(seededRandom(seed) * 256); // Full range for intense color
  }

  // Generate intense color
  const r = randomWithSeed(seedValue);
  const g = randomWithSeed(seedValue + 1); // Slightly offset seed for each color component
  const b = randomWithSeed(seedValue + 2);

  const intenseColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

  // Generate pastel color by averaging with white (255, 255, 255)
  const pastelR = Math.floor((r + 255 * 5) / 6);
  const pastelG = Math.floor((g + 255 * 5) / 6);
  const pastelB = Math.floor((b + 255 * 5) / 6);

  const pastelColor = `#${pastelR.toString(16).padStart(2, '0')}${pastelG.toString(16).padStart(2, '0')}${pastelB.toString(16).padStart(2, '0')}`;

  return {
    intense: intenseColor,
    pastel: pastelColor,
  };
}

export const newNode = () => {
  return {
    data: '',
    children: [],
    id: nanoid(),
    color: Math.random() * 1000000,
  };
};
