import { motion } from 'framer-motion';

const Card = ({ 
  title, 
  children, 
  className = '', 
  animate = true,
  hover = true
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const CardContent = (
    <div className={`card ${hover ? 'hover:shadow-md' : ''} ${className}`}>
      {title && (
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        transition={{ duration: 0.3 }}
      >
        {CardContent}
      </motion.div>
    );
  }

  return CardContent;
};

export default Card; 