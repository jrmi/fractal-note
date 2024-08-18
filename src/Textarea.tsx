import { useRef, useEffect, useCallback, useState } from 'preact/hooks';
import { useKeyboardEvent } from '@react-hookz/web';

const Textarea = ({ placeholder, onChange, value, ...rest }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [initialValue] = useState(value);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }, []);

  useKeyboardEvent(
    'Enter',
    (ev) => {
      if (!ev.shiftKey) {
        textareaRef.current.blur();
      }
      ev.stopPropagation();
    },
    [],
    { target: textareaRef }
  );

  useKeyboardEvent(
    'Escape',
    (ev) => {
      if (!ev.shiftKey) {
        onChange(initialValue);
        textareaRef.current.blur();
      }
      ev.stopPropagation();
    },
    [],
    { target: textareaRef }
  );

  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      onKeyDown={(ev) => ev.stopPropagation()}
      onChange={(ev) => {
        onChange(ev.target.value);
      }}
      {...rest}
    >
      {value}
    </textarea>
  );
};

export default Textarea;
