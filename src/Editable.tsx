import { useState, useRef, useEffect } from 'preact/hooks';
import { styled } from 'goober';
import useHover from './useHover';
import Textarea from './Textarea';
import { useKeyboardEvent } from '@react-hookz/web';

const Wrapper = styled('div')`
  .editable__textarea,
  .editable__text {
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
    box-shadow: none;
    resize: none;
    padding: 5px 10px;
  }

  .editable__textarea {
    position: absolute;
    inset: 0;
  }

  .editable__text {
    ${(props) => (props.edit ? 'visibility: hidden;' : '')}
  }
`;

export default function Editable({ value, onChange, edit, onBlur, setEdit }) {
  const contentRef = useRef(null);

  const handleBlur = () => {
    setEdit(false);
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <Wrapper edit={edit}>
      {edit && (
        <Textarea
          class='editable__textarea'
          onChange={onChange}
          onBlur={handleBlur}
          value={value}
        />
      )}
      <div class='editable__text' ref={contentRef}>
        {edit ? value + ' ' : value}
      </div>
    </Wrapper>
  );
}
