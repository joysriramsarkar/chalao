class MapConfig {
  static const String cartoApiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfbjk4enk5eXoiLCJqdGkiOiI4YmQ1ZjQ5YyJ9.ATAaA7HU9cW4xE8PPZFS8BvB4OeUUB6PhB62vK9h9h8';
  
  // Carto Dark Matter (Sleek dark theme for Driver Cockpit)
  static const String cartoDarkMatterUrl = 
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?api_key=$cartoApiKey';

  // Carto Voyager (Clean vivid tiles)
  static const String cartoVoyagerUrl = 
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key=$cartoApiKey';

  static const List<String> subdomains = ['a', 'b', 'c', 'd'];
}
