/**
 * Animation Utilities
 *
 * Centralized animation variants and timing constants for Framer Motion.
 *
 * @example
 * import { fadeIn, stagger, ANIMATION_TIMING } from '@/lib/animation'
 *
 * <motion.div variants={fadeIn} initial="hidden" animate="visible">
 *   Content
 * </motion.div>
 */

export {
  // Timing constants
  ANIMATION_TIMING,
  ANIMATION_OFFSETS,
  // Variants
  fadeIn,
  fadeInLeft,
  fadeInRight,
  stagger,
  staggerFast,
  scaleIn,
  slideInUp,
  // Utility functions
  getDirectionalFade,
} from './variants'
