import { useState, useEffect } from 'preact/hooks';

const useHover = (ref) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const node = ref.current;

    const handleMouseEnter = () => {
      // Ne fait rien lors de l'entrée de la souris
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    const handleMouseMove = () => {
      // Active l'état hovered seulement si la souris est dans l'élément et bouge
      setIsHovered(true);
    };

    if (node) {
      node.addEventListener('mouseenter', handleMouseEnter);
      node.addEventListener('mouseleave', handleMouseLeave);
      node.addEventListener('mousemove', handleMouseMove);

      // Cleanup function
      return () => {
        node.removeEventListener('mouseenter', handleMouseEnter);
        node.removeEventListener('mouseleave', handleMouseLeave);
        node.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [ref]);

  return isHovered;
};

export default useHover;
