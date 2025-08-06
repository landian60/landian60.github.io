// 高级访客统计系统
// Enhanced Visitor Statistics System

class AdvancedVisitorStats {
  constructor() {
    this.config = {
      storageKey: 'advanced_visitor_stats',
      sessionKey: 'visitor_session',
      endpoints: {
        // 主要API - ipapi.co (免费且可靠)
        primary: 'https://ipapi.co/json/',
        // 备用APIs
        backup: [
          'https://api.ipify.org?format=json',
          'https://httpbin.org/ip',
          'https://api.myip.com'
        ]
      },
      updateInterval: 60000, // 1分钟更新一次在线人数
      sessionTimeout: 30 * 60 * 1000, // 30分钟会话超时
      retryAttempts: 3,
      retryDelay: 2000
    };

    this.cache = {
      locationData: null,
      lastLocationFetch: null,
      cacheTimeout: 24 * 60 * 60 * 1000 // 24小时缓存
    };

    this.init();
  }

  async init() {
    try {
      await this.loadStats();
      await this.updateVisitCounts();
      await this.fetchLocationData();
      this.startPeriodicUpdates();
      this.setupVisibilityHandler();
    } catch (error) {
      console.error('访客统计初始化失败:', error);
      this.showError();
    }
  }

  // 加载统计数据
  loadStats() {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      this.stats = stored ? JSON.parse(stored) : {
        totalVisits: 0,
        uniqueVisits: 0,
        dailyStats: {},
        weeklyStats: {},
        monthlyStats: {},
        firstVisit: Date.now(),
        lastVisit: null,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        sessions: []
      };
    } catch (error) {
      console.warn('加载统计数据失败, 使用默认值:', error);
      this.stats = this.getDefaultStats();
    }
  }

  // 获取默认统计数据
  getDefaultStats() {
    return {
      totalVisits: 0,
      uniqueVisits: 0,
      dailyStats: {},
      weeklyStats: {},
      monthlyStats: {},
      firstVisit: Date.now(),
      lastVisit: null,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      sessions: []
    };
  }

  // 更新访问计数
  async updateVisitCounts() {
    const now = Date.now();
    const today = this.getDateKey(now);
    const session = this.getCurrentSession();

    // 检查是否为新会话
    if (this.isNewSession(session)) {
      this.stats.totalVisits += 1;
      this.recordVisit(today, now);
      this.createNewSession(now);
    }

    // 更新最后访问时间
    this.stats.lastVisit = now;
    this.saveStats();

    // 更新显示
    this.updateDisplays();
  }

  // 检查是否为新会话
  isNewSession(session) {
    if (!session) return true;
    const sessionAge = Date.now() - session.startTime;
    return sessionAge > this.config.sessionTimeout;
  }

  // 获取当前会话
  getCurrentSession() {
    try {
      const session = sessionStorage.getItem(this.config.sessionKey);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      return null;
    }
  }

  // 创建新会话
  createNewSession(timestamp) {
    const session = {
      id: this.generateSessionId(),
      startTime: timestamp,
      pageViews: 1,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    try {
      sessionStorage.setItem(this.config.sessionKey, JSON.stringify(session));
      this.stats.sessions.push({
        id: session.id,
        startTime: timestamp,
        duration: 0
      });

      // 只保留最近100个会话
      if (this.stats.sessions.length > 100) {
        this.stats.sessions = this.stats.sessions.slice(-100);
      }
    } catch (error) {
      console.warn('无法创建会话:', error);
    }
  }

  // 生成会话ID
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 记录访问
  recordVisit(dateKey, timestamp) {
    // 日统计
    if (!this.stats.dailyStats[dateKey]) {
      this.stats.dailyStats[dateKey] = { visits: 0, unique: 0 };
    }
    this.stats.dailyStats[dateKey].visits += 1;

    // 周统计
    const weekKey = this.getWeekKey(timestamp);
    if (!this.stats.weeklyStats[weekKey]) {
      this.stats.weeklyStats[weekKey] = { visits: 0, unique: 0 };
    }
    this.stats.weeklyStats[weekKey].visits += 1;

    // 月统计
    const monthKey = this.getMonthKey(timestamp);
    if (!this.stats.monthlyStats[monthKey]) {
      this.stats.monthlyStats[monthKey] = { visits: 0, unique: 0 };
    }
    this.stats.monthlyStats[monthKey].visits += 1;

    // 清理旧数据（保留3个月）
    this.cleanOldData();
  }

  // 清理旧数据
  cleanOldData() {
    const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const cutoffDate = this.getDateKey(threeMonthsAgo);

    // 清理日统计
    Object.keys(this.stats.dailyStats).forEach(date => {
      if (date < cutoffDate) {
        delete this.stats.dailyStats[date];
      }
    });
  }

  // 获取位置数据
  async fetchLocationData() {
    // 检查缓存
    if (this.cache.locationData && 
        this.cache.lastLocationFetch && 
        (Date.now() - this.cache.lastLocationFetch < this.cache.cacheTimeout)) {
      this.updateLocationDisplay(this.cache.locationData);
      return;
    }

    try {
      const locationData = await this.getLocationWithRetry();
      if (locationData) {
        this.cache.locationData = locationData;
        this.cache.lastLocationFetch = Date.now();
        this.updateLocationDisplay(locationData);
      }
    } catch (error) {
      console.error('获取位置信息失败:', error);
      this.updateLocationDisplay({ error: true });
    }
  }

  // 带重试的位置获取
  async getLocationWithRetry() {
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(this.config.endpoints.primary, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'default'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.error) throw new Error(data.reason);

        return this.processLocationData(data);
      } catch (error) {
        console.warn(`位置获取尝试 ${attempt + 1} 失败:`, error);
        
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(this.config.retryDelay * (attempt + 1));
        }
      }
    }
    throw new Error('所有位置获取尝试都失败了');
  }

  // 处理位置数据
  processLocationData(data) {
    return {
      ip: data.ip || '未知',
      city: data.city || '',
      region: data.region || data.region_code || '',
      country: data.country_name || data.country || '',
      countryCode: data.country_code || '',
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      timezone: data.timezone || '',
      isp: data.org || data.isp || '',
      asn: data.asn || ''
    };
  }

  // 更新位置显示
  updateLocationDisplay(data) {
    if (data.error) {
      this.updateElement('ip-text', '获取失败', 'error-text');
      this.updateElement('location-text', '位置信息获取失败', 'error-text');
      return;
    }

    // 更新IP（带隐私保护）
    const maskedIP = this.maskIP(data.ip);
    this.updateElement('ip-text', maskedIP);

    // 更新位置
    const location = this.formatLocation(data);
    this.updateElement('location-text', location);

    // 添加国旗emoji（如果有国家代码）
    if (data.countryCode) {
      const flag = this.getCountryFlag(data.countryCode);
      this.updateElement('location-text', `${flag} ${location}`);
    }
  }

  // 获取国家旗帜emoji
  getCountryFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    
    const flagMap = {
      'CN': '🇨🇳', 'US': '🇺🇸', 'JP': '🇯🇵', 'KR': '🇰🇷', 
      'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'CA': '🇨🇦',
      'AU': '🇦🇺', 'IN': '🇮🇳', 'BR': '🇧🇷', 'RU': '🇷🇺'
    };
    
    return flagMap[countryCode.toUpperCase()] || '';
  }

  // 掩码IP地址
  maskIP(ip) {
    if (!ip || ip === '未知') return ip;
    
    if (ip.includes('.')) {
      // IPv4
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.*.***`;
    } else if (ip.includes(':')) {
      // IPv6
      const parts = ip.split(':');
      return parts.slice(0, 3).join(':') + ':****';
    }
    
    return ip;
  }

  // 格式化位置
  formatLocation(data) {
    const parts = [data.city, data.region, data.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '位置未知';
  }

  // 更新所有显示
  updateDisplays() {
    const today = this.getDateKey(Date.now());
    const todayStats = this.stats.dailyStats[today] || { visits: 0 };
    const onlineCount = this.calculateOnlineUsers();

    this.updateElement('visitor-count', this.formatNumber(this.stats.totalVisits));
    this.updateElement('today-count', this.formatNumber(todayStats.visits));
    this.updateElement('online-count', onlineCount);
  }

  // 计算在线用户数（模拟算法）
  calculateOnlineUsers() {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // 基于时间的基础人数
    let baseCount;
    if (hour >= 9 && hour <= 18) {
      baseCount = 8 + Math.floor(Math.sin((hour - 9) / 9 * Math.PI) * 5);
    } else if (hour >= 19 && hour <= 23) {
      baseCount = 6 + Math.floor(Math.sin((hour - 19) / 4 * Math.PI) * 3);
    } else {
      baseCount = 1 + Math.floor(Math.random() * 3);
    }

    // 周末调整
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      baseCount = Math.floor(baseCount * 0.7);
    }

    // 添加随机因素
    const randomFactor = Math.floor(Math.random() * 3) - 1;
    
    return Math.max(1, baseCount + randomFactor);
  }

  // 更新元素
  updateElement(id, content, className = '') {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = content;
      element.className = className;
      element.classList.add('fade-in');
    }
  }

  // 格式化数字
  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  // 保存统计数据
  saveStats() {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('保存统计数据失败:', error);
    }
  }

  // 开始周期性更新
  startPeriodicUpdates() {
    setInterval(() => {
      this.updateDisplays();
    }, this.config.updateInterval);
  }

  // 设置页面可见性处理
  setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateDisplays();
      }
    });
  }

  // 显示错误
  showError() {
    this.updateElement('visitor-count', '加载失败', 'error-text');
    this.updateElement('today-count', '加载失败', 'error-text');
    this.updateElement('online-count', '加载失败', 'error-text');
  }

  // 工具方法
  getDateKey(timestamp) {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  getWeekKey(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  getMonthKey(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.visitorStats = new AdvancedVisitorStats();
  });
} else {
  window.visitorStats = new AdvancedVisitorStats();
}
