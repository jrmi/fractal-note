import { styled } from 'goober';
import Node from './Node';
import { useState, useRef, useEffect } from 'preact/hooks';

const StyledNodes = styled('div')`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`;

export default function Nodes({ nodes, path = [], ...rest }) {
  const itemRefs = useRef([]);
  const parentRef = useRef(null);
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const parentRect = parentRef.current.getBoundingClientRect();
    const newLines = itemRefs.current.map((childRef) => {
      if (!childRef) {
        return '';
      }
      const childRect = childRef.getBoundingClientRect();

      const [startX, startY] = [0, parentRect.height / 2];
      const [endX, endY] = [
        40,
        childRect.top + childRect.height / 2 - parentRect.top,
      ];

      const controlPointX1 = startX + 20;
      const controlPointY1 = startY;
      const controlPointX2 = endX - 40;
      const controlPointY2 = endY;

      return `M ${startX},${startY} C ${controlPointX1},${controlPointY1} ${controlPointX2},${controlPointY2} ${endX},${endY}`;
    });

    setLines(newLines);
  }, [nodes]);

  return (
    <div ref={parentRef}>
      <StyledNodes>
        {nodes.map((node, index) => (
          <div key={node.id} ref={(el) => (itemRefs.current[index] = el)}>
            <Node {...node} {...rest} path={[...path, index]} />
          </div>
        ))}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: -40,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {lines.map((path, index) => (
            <path
              key={index}
              d={path}
              stroke='black'
              strokeWidth='1'
              fill='none'
            />
          ))}
        </svg>
      </StyledNodes>
    </div>
  );
}
