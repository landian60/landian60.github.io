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
      console.error('Visitor stats initialization failed:', error);
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
        visitors: {}, // 添加visitors对象用于存储访客信息
        firstVisit: Date.now(),
        lastVisit: null,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        sessions: []
      };
    } catch (error) {
      console.warn('Failed to load stats data, using defaults:', error);
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
      visitors: {}, // 添加visitors对象
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

    // 检查是否为新访客（更严格的条件）
    if (this.isNewVisitor()) {
      this.stats.totalVisits += 1;
      this.recordVisit(today, now);
      
      // 更新最后访问时间
      this.stats.lastVisit = now;
      this.saveStats();
      
      console.log(`New visit recorded. Total: ${this.stats.totalVisits}`);
    }

    // 创建会话（用于在线统计）
    if (this.isNewSession(session)) {
      this.createNewSession(now);
    }

    // 更新显示
    this.updateDisplays();
  }

  // 检查是否为新会话
  isNewSession(session) {
    if (!session) return true;
    const sessionAge = Date.now() - session.startTime;
    return sessionAge > this.config.sessionTimeout;
  }

  // 检查是否为新访客（基于更严格的条件）
  isNewVisitor() {
    const lastVisit = this.stats.lastVisit;
    if (!lastVisit) return true;
    
    // 如果上次访问超过4小时，算作新访问
    const timeDiff = Date.now() - lastVisit;
    return timeDiff > (4 * 60 * 60 * 1000);
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
      console.warn('Unable to create session:', error);
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
      console.error('Failed to get location info:', error);
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
        console.warn(`Location fetch attempt ${attempt + 1} failed:`, error);
        
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(this.config.retryDelay * (attempt + 1));
        }
      }
    }
    throw new Error('All location fetch attempts failed');
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
      this.updateElement('ip-text', 'Failed', 'error-text');
      this.updateElement('location-text', 'Location unavailable', 'error-text');
      return;
    }

    const maskedIP = this.maskIP(data.ip);
    this.updateElement('ip-text', maskedIP);

    const location = this.formatLocation(data);
    this.updateElement('location-text', location);

    if (data.countryCode) {
      const flag = this.getCountryFlag(data.countryCode);
      this.updateElement('location-text', `${flag} ${location}`);
    }

    // Save to local visitors index for map usage
    this.saveVisitorInfo(data);

    // Optionally report to external endpoint (if configured)
    this.reportVisitor(data).catch(() => {/* noop */});
  }

  // Report visitor to optional external endpoint (Google Apps Script / webhook etc.)
  async reportVisitor(data) {
    try {
      const endpoint = (typeof window !== 'undefined' && window.VISITOR_API) ? window.VISITOR_API : '';
      if (!endpoint) return; // silently skip if not configured

      const payload = {
        timestamp: Date.now(),
        ip: data.ip || '',
        countryCode: data.countryCode || '',
        country: data.country || '',
        region: data.region || '',
        city: data.city || '',
        timezone: data.timezone || '',
        userAgent: navigator.userAgent,
        referrer: document.referrer || '',
      };

      // POST JSON
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // no-cors allows success without reading response on GAS default settings
        mode: 'no-cors'
      });
    } catch (e) {
      // Swallow errors to avoid impacting UX on GitHub Pages
      console.warn('reportVisitor failed:', e);
    }
  }

  // 保存访客信息
  saveVisitorInfo(data) {
    if (data.error || !data.ip) return;

    const visitorId = this.generateVisitorId(data.ip);
    const now = Date.now();
    
    if (!this.stats.visitors) {
      this.stats.visitors = {};
    }

    // 不使用可选链，兼容旧浏览器
    var prev = this.stats.visitors[visitorId] ? this.stats.visitors[visitorId] : {};

    // 更新或创建访客记录
    this.stats.visitors[visitorId] = {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country,
      countryCode: data.countryCode,
      firstVisit: prev.firstVisit ? prev.firstVisit : now,
      lastVisit: now,
      visitCount: (prev.visitCount ? prev.visitCount : 0) + 1
    };

    this.saveStats();
  }

  // 生成访客ID（基于IP的哈希）
  generateVisitorId(ip) {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
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
    if (!ip || ip === 'Unknown') return ip;
    
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
    return parts.length > 0 ? parts.join(', ') : 'Location unknown';
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

  // 计算在线用户数（基于真实访客数据的模拟算法）
  calculateOnlineUsers() {
    if (!this.stats.visitors) return 1;

    const now = Date.now();
    const recentThreshold = 30 * 60 * 1000; // 30分钟内算作在线
    const hour = new Date().getHours();
    
    // 计算最近活跃的访客数量（避免使用 Object.values 以提高兼容性）
    var recentVisitors = 0;
    for (var vid in this.stats.visitors) {
      if (!Object.prototype.hasOwnProperty.call(this.stats.visitors, vid)) continue;
      var visitor = this.stats.visitors[vid];
      if (visitor && (now - visitor.lastVisit) < recentThreshold) {
        recentVisitors++;
      }
    }

    // 基于时间的基础倍数
    var multiplier;
    if (hour >= 9 && hour <= 18) {
      multiplier = 1.5 + Math.sin((hour - 9) / 9 * Math.PI) * 0.8;
    } else if (hour >= 19 && hour <= 23) {
      multiplier = 1.2 + Math.sin((hour - 19) / 4 * Math.PI) * 0.5;
    } else {
      multiplier = 0.3 + Math.random() * 0.4;
    }

    // 周末调整
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      multiplier *= 0.8;
    }

    var estimatedOnline = Math.max(1, Math.floor(recentVisitors * multiplier));
    if (recentVisitors === 0) {
      estimatedOnline = 1 + Math.floor(Math.random() * 3);
    }

    return estimatedOnline;
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
      // 添加时间戳验证
      this.stats.lastSave = Date.now();
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.stats));
      console.log(`Stats saved. Total visits: ${this.stats.totalVisits}`);
    } catch (error) {
      console.warn('Failed to save stats:', error);
    }
  }

  // 开始周期性更新
  startPeriodicUpdates() {
    setInterval(() => {
      this.updateDisplays();
      this.updateCurrentTime();
    }, this.config.updateInterval);

    // 每秒更新时间
    setInterval(() => {
      this.updateCurrentTime();
    }, 1000);
  }

  // 更新当前时间
  updateCurrentTime() {
    const timeString = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    this.updateElement('current-time', timeString);
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
    this.updateElement('visitor-count', 'Failed', 'error-text');
    this.updateElement('today-count', 'Failed', 'error-text');
    this.updateElement('online-count', 'Failed', 'error-text');
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
