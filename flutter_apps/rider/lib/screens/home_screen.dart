import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../config/map_config.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final MapController _mapController = MapController();
  LatLng _currentLocation = const LatLng(22.5726, 88.3639); // Kolkata default
  LatLng? _dropoffLocation;
  final _dropoffController = TextEditingController();
  String _pickupAddress = 'আপনার বর্তমান অবস্থান';
  String _selectedVehicle = 'sedan';
  bool _isLocating = true;

  final _vehicleTypes = [
    {'id': 'bike', 'icon': '🏍️', 'name': 'বাইক', 'fare': '₹8/কিমি', 'color': Color(0xFF10B981)},
    {'id': 'auto', 'icon': '🛺', 'name': 'অটো', 'fare': '₹12/কিমি', 'color': Color(0xFFF59E0B)},
    {'id': 'sedan', 'icon': '🚗', 'name': 'সেডান', 'fare': '₹16/কিমি', 'color': Color(0xFF6C3DF4)},
    {'id': 'suv', 'icon': '🚙', 'name': 'SUV', 'fare': '₹22/কিমি', 'color': Color(0xFF3B82F6)},
    {'id': 'ev', 'icon': '⚡', 'name': 'গ্রিন EV', 'fare': '₹14/কিমি', 'color': Color(0xFF059669)},
    {'id': 'pink', 'icon': '🌸', 'name': 'Pink (নারী)', 'fare': '₹16/কিমি', 'color': Color(0xFFEC4899)},
  ];

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        await Geolocator.requestPermission();
      }
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      if (!mounted) return;
      setState(() {
        _currentLocation = LatLng(pos.latitude, pos.longitude);
        _isLocating = false;
      });
      _mapController.move(_currentLocation, 15);
    } catch (_) {
      setState(() => _isLocating = false);
    }
  }

  void _onSearchDropoff() {
    // Navigate to ride request with current location
    Navigator.pushNamed(context, '/ride-request', arguments: {
      'pickupLat': _currentLocation.latitude,
      'pickupLng': _currentLocation.longitude,
      'pickupAddress': _pickupAddress,
      'vehicleType': _selectedVehicle,
    });
  }

  @override
  void dispose() {
    _dropoffController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AppState>().user;

    return Scaffold(
      body: Stack(
        children: [
          // Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentLocation,
              initialZoom: 14,
            ),
            children: [
              TileLayer(
                urlTemplate: MapConfig.cartoVoyagerUrl,
                subdomains: MapConfig.subdomains,
                userAgentPackageName: 'coop.chalao.rider',
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _currentLocation,
                    width: 40,
                    height: 40,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF6C3DF4),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [
                          BoxShadow(color: const Color(0xFF6C3DF4).withOpacity(0.4), blurRadius: 12),
                        ],
                      ),
                      child: const Icon(Icons.my_location, color: Colors.white, size: 18),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Top greeting bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 16)],
                      ),
                      child: Row(
                        children: [
                          const Text('👋', style: TextStyle(fontSize: 20)),
                          const SizedBox(width: 8),
                          Text(
                            'নমস্কার, ${user?.name?.split(' ').first ?? 'বন্ধু'}!',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, '/profile'),
                    child: Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12)],
                      ),
                      child: const Icon(Icons.person_outline, color: Color(0xFF6C3DF4)),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom sheet: search + vehicle picker
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 20)],
              ),
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Handle
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Pickup
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8F7FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E0FF)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: const BoxDecoration(
                            color: Color(0xFF6C3DF4),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _isLocating ? 'অবস্থান খোঁজা হচ্ছে...' : _pickupAddress,
                            style: const TextStyle(fontSize: 14),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  // Dropoff search (tappable)
                  GestureDetector(
                    onTap: _onSearchDropoff,
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF6C3DF4), width: 2),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.search, color: Color(0xFF6C3DF4)),
                          const SizedBox(width: 12),
                          Text(
                            'কোথায় যাবেন?',
                            style: TextStyle(color: Colors.grey[500], fontSize: 15),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Vehicle type picker
                  SizedBox(
                    height: 90,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _vehicleTypes.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 10),
                      itemBuilder: (ctx, i) {
                        final v = _vehicleTypes[i];
                        final selected = _selectedVehicle == v['id'];
                        return GestureDetector(
                          onTap: () => setState(() => _selectedVehicle = v['id'] as String),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 80,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: selected ? (v['color'] as Color).withOpacity(0.12) : const Color(0xFFF8F7FF),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: selected ? v['color'] as Color : const Color(0xFFE2E0FF),
                                width: selected ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(v['icon'] as String, style: const TextStyle(fontSize: 26)),
                                const SizedBox(height: 4),
                                Text(v['name'] as String, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
                                Text(v['fare'] as String, style: TextStyle(fontSize: 9, color: Colors.grey[500])),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _onSearchDropoff,
                          child: const Text('রাইড বুক করুন'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      InkWell(
                        onTap: () => Navigator.pushNamed(context, '/trip-history'),
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          width: 54,
                          height: 54,
                          decoration: BoxDecoration(
                            border: Border.all(color: const Color(0xFFE2E0FF)),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.history, color: Color(0xFF6C3DF4)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
