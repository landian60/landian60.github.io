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
      this.loadStats();
      await this.updateVisitCounts();
      await this.fetchLocationData();
      this.updateCurrentTime(); // 立即更新时间
      
      // 延迟更新Top Locations，确保DOM元素已加载
      setTimeout(() => {
        this.updateTopLocations();
      }, 500);
      
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
        firstVisit: Date.now(),
        lastVisit: null,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        sessions: [],
        visitors: {} // 存储访客位置信息
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
      firstVisit: Date.now(),
      lastVisit: null,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      sessions: [],
      visitors: {} // 存储访客位置信息
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

    // 保存访客位置信息用于Top Locations
    this.saveVisitorLocation(data);
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

    console.log('Updating displays - Total:', this.stats.totalVisits, 'Today:', todayStats.visits, 'Online:', onlineCount);

    this.updateElement('visitor-count', this.formatNumber(this.stats.totalVisits));
    this.updateElement('today-count', this.formatNumber(todayStats.visits));
    this.updateElement('online-count', onlineCount);
    
    // 更新移动端显示
    this.updateElement('mobile-visitor-count', this.formatNumber(this.stats.totalVisits));
    this.updateElement('mobile-today-count', this.formatNumber(todayStats.visits));
    this.updateElement('mobile-online-count', onlineCount);
    
    // 更新当前时间
    this.updateCurrentTime();
  }

  // 更新当前时间显示
  updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    this.updateElement('current-time', timeString);
  }

  // 保存访客位置信息
  saveVisitorLocation(data) {
    if (!data.country || data.error) return;

    const now = Date.now();
    const visitorId = this.generateVisitorId(data);
    
    // 只保存最近3个月的数据
    const threeMonthsAgo = now - (90 * 24 * 60 * 60 * 1000);
    
    if (!this.stats.visitors) {
      this.stats.visitors = {};
    }

    // 检查是否是新的访客位置记录
    const existingVisitor = this.stats.visitors[visitorId];
    if (!existingVisitor || (now - existingVisitor.lastVisit) > (4 * 60 * 60 * 1000)) {
      this.stats.visitors[visitorId] = {
        country: data.country,
        city: data.city,
        region: data.region,
        countryCode: data.countryCode,
        flag: this.getCountryFlag(data.countryCode),
        firstVisit: existingVisitor ? existingVisitor.firstVisit : now,
        lastVisit: now,
        visits: (existingVisitor ? existingVisitor.visits : 0) + 1
      };

      // 清理旧数据
      this.cleanOldVisitorData(threeMonthsAgo);
      
      // 保存数据并更新显示
      this.saveStats();
      
      // 延迟更新Top Locations
      setTimeout(() => {
        this.updateTopLocations();
      }, 200);
    }
  }

  // 生成访客ID
  generateVisitorId(data) {
    // 基于IP和用户代理生成简单ID
    const identifier = (data.ip || 'unknown') + '_' + (data.country || 'unknown');
    return btoa(identifier).replace(/[+=\/]/g, '').substring(0, 12);
  }

  // 清理旧的访客数据
  cleanOldVisitorData(cutoffTime) {
    if (!this.stats.visitors) return;

    Object.keys(this.stats.visitors).forEach(visitorId => {
      const visitor = this.stats.visitors[visitorId];
      if (visitor.lastVisit < cutoffTime) {
        delete this.stats.visitors[visitorId];
      }
    });
  }

  // 更新Top Locations显示
  updateTopLocations() {
    const listElement = document.getElementById('top-locations-list');
    if (!listElement) {
      console.warn('Top locations list element not found');
      return;
    }

    if (!this.stats.visitors || Object.keys(this.stats.visitors).length === 0) {
      listElement.innerHTML = '<div class="loading-indicator">No visitor data yet</div>';
      return;
    }

    // 统计每个位置的访问次数
    const locationStats = {};
    Object.values(this.stats.visitors).forEach(visitor => {
      const locationKey = visitor.country;
      if (locationKey) {
        if (!locationStats[locationKey]) {
          locationStats[locationKey] = {
            name: locationKey,
            flag: visitor.flag,
            count: 0
          };
        }
        locationStats[locationKey].count += visitor.visits;
      }
    });

    // 排序并取前5名
    const topLocations = Object.values(locationStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (topLocations.length === 0) {
      listElement.innerHTML = '<div class="loading-indicator">No data available</div>';
      return;
    }

    // 生成HTML
    const html = topLocations.map(location => `
      <div class="location-item">
        <div class="location-name">
          <span>${location.flag}</span>
          <span>${location.name}</span>
        </div>
        <div class="location-count">${location.count}</div>
      </div>
    `).join('');

    listElement.innerHTML = html;
    console.log('Top locations updated with', topLocations.length, 'locations');
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
    
    const result = Math.max(1, baseCount + randomFactor);
    console.log('Calculated online users:', result, 'hour:', hour, 'day:', dayOfWeek);
    return result;
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
    }, this.config.updateInterval);
    
    // 每秒更新时间
    setInterval(() => {
      this.updateCurrentTime();
    }, 1000);
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
