import { logger } from '@/lib/utils/logger'

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
    
    // Clear logs
    logger.clearLogs()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('log levels', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message', { test: true })
      
      expect(consoleDebugSpy).toHaveBeenCalled()
      const logs = logger.getLogs('debug')
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('Debug message')
    })

    it('should log info messages', () => {
      logger.info('Info message', { test: true })
      
      expect(consoleLogSpy).toHaveBeenCalled()
      const logs = logger.getLogs('info')
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('Info message')
    })

    it('should log warning messages', () => {
      logger.warn('Warning message', { test: true })
      
      expect(consoleWarnSpy).toHaveBeenCalled()
      const logs = logger.getLogs('warn')
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('Warning message')
    })

    it('should log error messages', () => {
      const error = new Error('Test error')
      logger.error('Error message', { test: true }, error)
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logs = logger.getLogs('error')
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('Error message')
    })
  })

  describe('log storage', () => {
    it('should store logs in memory', () => {
      logger.info('Test 1')
      logger.warn('Test 2')
      logger.error('Test 3')
      
      const allLogs = logger.getLogs()
      expect(allLogs).toHaveLength(3)
    })

    it('should respect max log limit', () => {
      // Create more logs than the limit
      for (let i = 0; i < 1100; i++) {
        logger.info(`Log ${i}`)
      }
      
      const allLogs = logger.getLogs()
      expect(allLogs.length).toBeLessThanOrEqual(1000)
    })

    it('should clear logs', () => {
      logger.info('Test log')
      expect(logger.getLogs()).toHaveLength(1)
      
      logger.clearLogs()
      expect(logger.getLogs()).toHaveLength(0)
    })
  })

  describe('performance timing', () => {
    it('should measure performance with time()', async () => {
      const endTimer = logger.time('test-operation')
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const duration = endTimer()
      
      expect(duration).toBeGreaterThan(90)
      expect(duration).toBeLessThan(200)
      
      // Check that timing was logged
      const logs = logger.getLogs('info')
      const timingLog = logs.find(log => log.message.includes('Timer completed'))
      expect(timingLog).toBeDefined()
    })

    it('should handle timeEnd() for non-existent timer', () => {
      const duration = logger.timeEnd('non-existent')
      
      expect(duration).toBeNull()
      
      // Should log a warning
      const logs = logger.getLogs('warn')
      expect(logs.some(log => log.message.includes('Timer not found'))).toBe(true)
    })
  })

  describe('context logging', () => {
    it('should handle component and action context', () => {
      logger.info('Test message', {
        component: 'TestComponent',
        action: 'testAction',
        metadata: { userId: '123' }
      })
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestComponent:testAction]'),
        expect.any(String),
        expect.objectContaining({ userId: '123' })
      )
    })

    it('should handle error context', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', {
        component: 'TestComponent',
        action: 'testAction',
        error
      })
      
      const logs = logger.getLogs('error')
      expect(logs[0].error).toBeDefined()
      expect(logs[0].error?.message).toBe('Test error')
    })
  })
})