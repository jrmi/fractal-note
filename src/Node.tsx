import { useRef, useEffect, useState } from 'preact/hooks';
import { styled } from 'goober';
import { useKeyboardEvent } from '@react-hookz/web';

import Nodes from './Nodes';
import useHover from './useHover';
import Editable from './Editable';

const StyledNode = styled('div')`
  display: flex;
  font-size: 1em;
  color: color-mix(in srgb, currentColor, white 15%);
  font-family: Arial, sans-serif;
`;

const StyledNodeContent = styled('div')`
  cursor: pointer;
  max-width: 33vw;
  display: flex;
  align-items: center;
  margin: 0.1em 0;
  user-select: none;
  flex-shrink: 0;
  position: relative;

  .node__content {
    margin-bottom: 4px;
    position: relative;
    border-radius: 8px;
    margin-right: 20px;
    border-left: 1px solid #646464;
    /* border-right: 1px solid #646464; */
    /* box-shadow: 0 2px 0px rgba(0, 0, 0, 0.08); */
    ${(props) => (props.hasChildren ? 'padding-right: 1.5em;' : '')}

    /* background-color: #f3f3f3;*/
    ${(props) => (props.selected ? 'background-color: #c7ff9f;' : '')}
    ${(props) => (props.edit ? 'background-color: #9fffe4;' : '')}
    ${({ dragTarget }) => {
      switch (dragTarget) {
        case 'before':
          return 'background: linear-gradient(-180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 100%);';
        case 'after':
          return 'background: linear-gradient(0deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 100%);';
        case 'addChild':
          return 'background: linear-gradient(-90deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 100%);';
        default:
          return '';
      }
    }}
  }

  .node__plus {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    pointer-events: none;

    &::before {
      content: ${(props) => (props.opened ? "'[-]'" : "'[+]'")};
      margin-right: 2px;
      margin-top: -4px;
    }
  }
`;

export default function Node({
  id: nodeId,
  data,
  open,
  children = [],
  ...rest
}) {
  const { onSelect, selectedNodeId, updateNode, setEdit, edit, moveNode } =
    rest;
  const contentRef = useRef(null);
  const isHovered = useHover(contentRef);
  const [dragTarget, setDragTarget] = useState(null);
  const hasChildren = children.length > 0;
  const isSelected = nodeId === selectedNodeId;
  const isEdited = isSelected && edit;

  useEffect(() => {
    if (isHovered) {
      onSelect(nodeId);
    }
  }, [isHovered, nodeId]);

  useEffect(() => {
    if (isSelected) {
      contentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [isSelected]);

  useEffect(() => {
    if (open) {
      contentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [open]);

  useKeyboardEvent(
    true,
    (ev) => {
      if (!isSelected) {
        return;
      }
      switch (ev.key) {
        case ' ':
          if (hasChildren) {
            updateNode(nodeId, (prevNode) => ({
              ...prevNode,
              open: !prevNode.open,
            }));
          }
          break;
        case 'e':
        case 'F2':
          setEdit(true);
          break;
      }
    },
    [isSelected, hasChildren]
  );

  const handleClick = () => {
    updateNode(nodeId, (prevNode) => ({
      ...prevNode,
      open: !prevNode.open,
    }));
  };

  const handleChange = (newValue) => {
    updateNode(nodeId, (prevNode) => ({
      ...prevNode,
      data: newValue,
    }));
  };

  const handleDragStart = (ev) => {
    ev.dataTransfer.setData('text/plain', nodeId);
  };

  const handleDragHover = (ev) => {
    const contentRect = contentRef.current.getBoundingClientRect();
    const x = ev.clientX - contentRect.left;
    const y = ev.clientY - contentRect.top;
    if (x > (contentRect.width / 3) * 2) {
      setDragTarget('addChild');
    } else {
      if (y > contentRect.height / 2) {
        setDragTarget('after');
      } else {
        setDragTarget('before');
      }
    }
    ev.preventDefault();
  };

  const handleDragLeave = (ev) => {
    setDragTarget(null);
    ev.preventDefault();
  };

  const handleDrop = (ev) => {
    ev.preventDefault();
    setDragTarget(null);

    const sourceNodeId = ev.dataTransfer.getData('text/plain');
    const contentRect = contentRef.current.getBoundingClientRect();
    const x = ev.clientX - contentRect.left;
    const y = ev.clientY - contentRect.top;
    if (x > (contentRect.width / 3) * 2) {
      moveNode(sourceNodeId, nodeId, 'addChild');
    } else {
      if (y > contentRect.height / 2) {
        moveNode(sourceNodeId, nodeId, 'after');
      } else {
        moveNode(sourceNodeId, nodeId, 'before');
      }
    }
  };

  return (
    <StyledNode>
      <StyledNodeContent
        onClick={handleClick}
        hasChildren={hasChildren}
        selected={isSelected}
        opened={open}
        edit={isEdited}
        dragTarget={dragTarget}
      >
        <div
          class='node__content'
          ref={contentRef}
          draggable
          onDragStart={handleDragStart}
          onDragOver={handleDragHover}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Editable
            value={data}
            onChange={handleChange}
            edit={isEdited}
            setEdit={setEdit}
          />
          {hasChildren && <div class='node__plus'></div>}
        </div>
      </StyledNodeContent>
      {hasChildren && open && <Nodes nodes={children} {...rest} />}
    </StyledNode>
  );
}
