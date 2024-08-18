import { useState, useRef, useEffect } from 'preact/hooks';
import { styled } from 'goober';
import Nodes from './Nodes';
import useHover from './useHover';
import Textarea from './Textarea';
import Editable from './Editable';
import { useKeyboardEvent } from '@react-hookz/web';

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
    position: relative;
    border-radius: 4px;
    background-color: #efefef;
    margin-right: 40px;
    ${(props) => (props.selected ? 'background-color: #c7ff9f;' : '')}
    ${(props) => (props.edit ? 'background-color: #d75f9f;' : '')}
    ${(props) => (props.hasChildren ? 'padding-right: 1.5em;' : '')}
  }

  .node__content-data {
    font-family: Arial, sans-serif;
    font-size: 1em;
    border: none;
    font-weight: normal;
    background-color: transparent;
    color: currentColor;
    white-space: pre-wrap;
    padding: 0;
    margin: 0;
    overflow: auto;
    outline: none;
    min-height: 1em;
    min-width: 4em;

    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;

    resize: none;
    padding: 5px 10px;
  }

  .node__content-data--edit {
    position: absolute;
    inset: 0;

    ${(props) => (props.hasChildren ? 'right: 1.5em;' : '')}
  }

  .node__content-data--read {
    ${(props) => (props.edit ? 'visibility: hidden;' : '')}
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

export default function Node({ data, open, children = [], ...rest }) {
  const { path, onSelect, selectedPath, updateNode, setEdit, edit } = rest;
  const contentRef = useRef(null);
  const isHovered = useHover(contentRef);
  const hasChildren = children.length > 0;
  const isSelected = path.join('.') === selectedPath.join('.');
  const isEdited = isSelected && edit;

  useEffect(() => {
    if (isHovered) {
      onSelect(path);
    }
  }, [isHovered, path.join('.')]);

  /*useEffect(() => {
    if (isSelected) {
      contentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [isSelected]);*/

  useEffect(() => {
    if (
      selectedPath.length > path.length &&
      selectedPath.join('.').startsWith(path.join('.'))
    ) {
      updateNode(path, (prevNode) => ({ ...prevNode, open: true }));
    }
  }, [selectedPath.join('.')]);

  useKeyboardEvent(
    true,
    (ev) => {
      if (!isSelected) {
        return;
      }
      switch (ev.key) {
        case ' ':
          if (hasChildren) {
            updateNode(path, (prevNode) => ({
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

  const handleChange = (newValue) => {
    //if (newValue !== null) {
    updateNode(path, (prevNode) => ({
      ...prevNode,
      data: newValue,
    }));
    //}
  };

  /*const handleBlur = (newValue) => {
    setEdit(false);
  };*/

  return (
    <StyledNode>
      <StyledNodeContent
        onClick={() =>
          updateNode(path, (prevNode) => ({
            ...prevNode,
            open: !prevNode.open,
          }))
        }
        hasChildren={hasChildren}
        selected={isSelected}
        opened={open}
        edit={isEdited}
      >
        <div class='node__content' ref={contentRef}>
          {/*isEdited && (
            <Textarea
              class='node__content-data node__content-data--edit'
              onChange={handleChange}
              onBlur={handleBlur}
              onClick={(ev) => ev.stopPropagation()}
              value={data}
            />
          )}
          <div
            class='node__content-data node__content-data--read'
            ref={contentRef}
          >
            {isEdited ? data + ' ' : data}
          </div>*/}
          <Editable
            value={data}
            onChange={handleChange}
            edit={isEdited}
            setEdit={setEdit}
          />
          {hasChildren && <div class='node__plus'></div>}
        </div>
      </StyledNodeContent>
      {hasChildren && open ? <Nodes nodes={children} {...rest} /> : null}
    </StyledNode>
  );
}
