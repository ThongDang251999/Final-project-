import { motion } from 'framer-motion';

const ProgressBar = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'primary',
  className = ''
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses = {
    primary: 'bg-primary-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500'
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">{label}</span>
          {showPercentage && (
            <span className="text-gray-600 dark:text-gray-400">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar; 