// 轻量日志工具：统一输出格式，便于后期定位问题
// 不改变业务逻辑，仅规范日志入口

const Logger = {
  /**
   * @param {string} scope
   * @param  {...any} args
   */
  info(scope, ...args) {
    console.log(`[${scope}]`, ...args);
  },

  /**
   * @param {string} scope
   * @param  {...any} args
   */
  warn(scope, ...args) {
    console.warn(`[${scope}]`, ...args);
  },

  /**
   * @param {string} scope
   * @param  {...any} args
   */
  error(scope, ...args) {
    console.error(`[${scope}]`, ...args);
  }
};

module.exports = Logger;
