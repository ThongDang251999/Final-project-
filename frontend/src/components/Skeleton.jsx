import { motion } from 'framer-motion';

const Skeleton = ({ 
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
  count = 1
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 rounded';
  
  const variantClasses = {
    rectangular: '',
    circular: 'rounded-full',
    text: 'h-4',
    avatar: 'h-10 w-10 rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave'
  };

  const skeletonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${animationClasses[animation]}
    ${className}
  `;

  if (count > 1) {
    return (
      <div className="space-y-2">
        {[...Array(count)].map((_, index) => (
          <motion.div
            key={index}
            className={skeletonClasses}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>
    );
  }

  return <div className={skeletonClasses} />;
};

export default Skeleton; 