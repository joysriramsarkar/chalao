import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/api_service.dart';
import '../config/map_config.dart';

class ActiveRideScreen extends StatefulWidget {
  const ActiveRideScreen({super.key});

  @override
  State<ActiveRideScreen> createState() => _ActiveRideScreenState();
}

class _ActiveRideScreenState extends State<ActiveRideScreen> {
  Timer? _pollTimer;
  Map<String, dynamic>? _ride;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _ride = context.read<AppState>().currentRide;
    _startPolling();
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _pollRide());
  }

  Future<void> _pollRide() async {
    if (_ride == null) return;
    try {
      final result = await ApiService.getRide(_ride!['id'] as int);
      final rideData = result['ride'] as Map<String, dynamic>;
      setState(() => _ride = rideData);
      context.read<AppState>().setCurrentRide(rideData);
      
      if (rideData['status'] == 'completed') {
        _pollTimer?.cancel();
        if (mounted) Navigator.pushReplacementNamed(context, '/trip-completed', arguments: rideData);
      }
    } catch (_) {}
  }

  Future<void> _cancelRide() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('রাইড বাতিল?'),
        content: const Text('আপনি কি নিশ্চিত রাইড বাতিল করতে চান?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('না')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('হ্যাঁ, বাতিল'),
          ),
        ],
      ),
    );
    if (confirm != true || _ride == null) return;
    await ApiService.updateRide(_ride!['id'] as int, {
      'status': 'cancelled',
      'cancelReason': 'Cancelled by rider',
    });
    if (!mounted) return;
    context.read<AppState>().setCurrentRide(null);
    Navigator.pushReplacementNamed(context, '/home');
  }

  String _statusLabel(String status) {
    const labels = {
      'searching': '🔍 ড্রাইভার খোঁজা হচ্ছে...',
      'accepted': '✅ ড্রাইভার গ্রহণ করেছেন',
      'arrived': '📍 ড্রাইভার পৌঁছেছেন',
      'pickup_confirmed': '🚗 যাত্রা শুরু',
      'ongoing': '🛣️ গন্তব্যের দিকে',
    };
    return labels[status] ?? status;
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final driverLat = _ride?['driver_lat'] as double?;
    final driverLng = _ride?['driver_lng'] as double?;
    final hasDriver = driverLat != null && driverLng != null;
    final status = _ride?['status'] as String? ?? 'searching';

    return WillPopScope(
      onWillPop: () async => false,
      child: Scaffold(
        body: Stack(
          children: [
            FlutterMap(
              options: MapOptions(
                initialCenter: hasDriver
                    ? LatLng(driverLat!, driverLng!)
                    : const LatLng(22.5726, 88.3639),
                initialZoom: 15,
              ),
              children: [
                TileLayer(
                  urlTemplate: MapConfig.cartoVoyagerUrl,
                  subdomains: MapConfig.subdomains,
                  userAgentPackageName: 'coop.chalao.rider',
                ),
                if (hasDriver)
                  MarkerLayer(markers: [
                    Marker(
                      point: LatLng(driverLat!, driverLng!),
                      width: 48,
                      height: 48,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 10)],
                        ),
                        child: const Center(child: Text('🚗', style: TextStyle(fontSize: 26))),
                      ),
                    ),
                  ]),
              ],
            ),

            // Top status bar
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12)],
                  ),
                  child: Row(
                    children: [
                      if (status == 'searching')
                        const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF6C3DF4))),
                      if (status != 'searching')
                        const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 18),
                      const SizedBox(width: 10),
                      Text(_statusLabel(status), style: const TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
            ),

            // Bottom sheet
            Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 20)],
                ),
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_ride?['driver_name'] != null) ...[
                      Row(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8F7FF),
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFFE2E0FF)),
                            ),
                            child: const Center(child: Text('👨', style: TextStyle(fontSize: 26))),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(_ride!['driver_name'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              Text('⭐ ${(_ride!['driver_rating'] as num?)?.toStringAsFixed(1) ?? '5.0'}  •  ${_ride!['vehicle_make'] ?? ''} ${_ride!['vehicle_model'] ?? ''}',
                                style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                            ]),
                          ),
                          IconButton(
                            onPressed: () {},
                            icon: const Icon(Icons.phone, color: Color(0xFF6C3DF4)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 12),
                    ],
                    // OTP PIN — shown to rider
                    if (_ride?['rider_otp_pin'] != null) ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF6C3DF4), Color(0xFF3B82F6)]),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.lock_outline, color: Colors.white),
                            const SizedBox(width: 10),
                            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              const Text('ট্রিপ শুরুর PIN', style: TextStyle(color: Colors.white70, fontSize: 12)),
                              Text(_ride!['rider_otp_pin'] as String,
                                style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold, letterSpacing: 6)),
                            ]),
                            const Spacer(),
                            const Text('ড্রাইভারকে\nদেখান', style: TextStyle(color: Colors.white70, fontSize: 11), textAlign: TextAlign.center),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    // Pickup & Dropoff
                    _buildRouteRow(_ride?['pickup_address'] as String? ?? '', _ride?['dropoff_address'] as String? ?? ''),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: status == 'searching' ? _cancelRide : null,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: const BorderSide(color: Colors.red),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              minimumSize: const Size.fromHeight(48),
                            ),
                            child: const Text('বাতিল'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.warning_amber, size: 18),
                            label: const Text('SOS'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                              minimumSize: const Size.fromHeight(48),
                            ),
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
      ),
    );
  }

  Widget _buildRouteRow(String pickup, String dropoff) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F7FF),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(children: [
            const Icon(Icons.circle, color: Color(0xFF6C3DF4), size: 10),
            const SizedBox(width: 10),
            Expanded(child: Text(pickup, style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)),
          ]),
          const SizedBox(height: 6),
          Row(children: [
            const Icon(Icons.location_on, color: Colors.red, size: 14),
            const SizedBox(width: 8),
            Expanded(child: Text(dropoff, style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)),
          ]),
        ],
      ),
    );
  }
}
