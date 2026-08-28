import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/api_service.dart';

class CockpitScreen extends StatefulWidget {
  const CockpitScreen({super.key});
  @override
  State<CockpitScreen> createState() => _CockpitScreenState();
}

class _CockpitScreenState extends State<CockpitScreen> {
  Timer? _locationTimer;
  Timer? _rideTimer;
  Map<String, dynamic>? _earnings;
  bool _loadingEarnings = true;
  int _todayRides = 0;
  double _todayEarned = 0;
  double _pendingPayout = 0;

  @override
  void initState() {
    super.initState();
    _loadEarnings();
    _startLocationTracking();
  }

  Future<void> _loadEarnings() async {
    try {
      final res = await ApiService.getEarnings(period: 'today');
      final today = res['today'] as Map<String, dynamic>;
      final summary = res['summary'] as Map<String, dynamic>;
      setState(() {
        _todayRides = int.tryParse(today['rides_today'].toString()) ?? 0;
        _todayEarned = double.tryParse(today['earned_today'].toString()) ?? 0;
        _pendingPayout = double.tryParse(summary['pending_payout'].toString()) ?? 0;
        _loadingEarnings = false;
      });
    } catch (_) {
      setState(() => _loadingEarnings = false);
    }
  }

  void _startLocationTracking() {
    _locationTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      final appState = context.read<DriverAppState>();
      if (!appState.isOnline) return;
      try {
        final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
        await ApiService.updateLocation(latitude: pos.latitude, longitude: pos.longitude, speed: pos.speed);
      } catch (_) {}
    });
  }

  Future<void> _toggleOnline(bool goOnline) async {
    try {
      final res = await ApiService.setOnlineStatus(goOnline);
      context.read<DriverAppState>().setOnline(goOnline);
      if (goOnline) {
        final pending = res['pendingRides'] as List?;
        if (pending != null && pending.isNotEmpty) {
          final ride = pending.first as Map<String, dynamic>;
          context.read<DriverAppState>().setIncomingRide(ride);
          if (!mounted) return;
          Navigator.pushNamed(context, '/incoming-ride');
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('সমস্যা: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    _rideTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<DriverAppState>();
    final user = appState.user;
    final isOnline = appState.isOnline;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('নমস্কার, ${user?['name']?.toString().split(' ').first ?? 'চালক'}!',
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 4),
                      Row(children: [
                        Container(
                          width: 8, height: 8,
                          decoration: BoxDecoration(
                            color: isOnline ? const Color(0xFF10B981) : Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(isOnline ? 'অনলাইন' : 'অফলাইন',
                          style: TextStyle(color: isOnline ? const Color(0xFF10B981) : Colors.red, fontSize: 13)),
                      ]),
                    ]),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, '/profile'),
                    child: Container(
                      width: 46, height: 46,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF334155)),
                      ),
                      child: const Icon(Icons.person_outline, color: Color(0xFF22D3EE)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Online/Offline Toggle
              GestureDetector(
                onTap: () => _toggleOnline(!isOnline),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 400),
                  height: 140,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isOnline
                          ? [const Color(0xFF064E3B), const Color(0xFF047857)]
                          : [const Color(0xFF1E293B), const Color(0xFF334155)],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isOnline ? const Color(0xFF10B981) : const Color(0xFF475569),
                    ),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isOnline ? Icons.wifi : Icons.wifi_off,
                          color: isOnline ? const Color(0xFF10B981) : Colors.white38,
                          size: 44,
                        ),
                        const SizedBox(height: 10),
                        Text(
                          isOnline ? 'আপনি অনলাইন\nট্যাপ করুন অফলাইন হতে' : 'ট্যাপ করুন অনলাইন হতে',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: isOnline ? const Color(0xFF10B981) : Colors.white54,
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Today's stats
              Row(
                children: [
                  _statCard('আজকের যাত্রা', '$_todayRides', Icons.directions_car, const Color(0xFF22D3EE)),
                  const SizedBox(width: 12),
                  _statCard('আজকের আয়', '₹${_todayEarned.toStringAsFixed(0)}', Icons.currency_rupee, const Color(0xFF10B981)),
                ],
              ),
              const SizedBox(height: 12),

              // Pending payout
              if (_pendingPayout > 0)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF22D3EE).withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Text('💳', style: TextStyle(fontSize: 28)),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('পেআউট বাকি', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12)),
                          Text('₹${_pendingPayout.toStringAsFixed(0)}',
                            style: const TextStyle(color: Color(0xFF22D3EE), fontSize: 22, fontWeight: FontWeight.bold)),
                        ]),
                      ),
                      ElevatedButton(
                        onPressed: () => Navigator.pushNamed(context, '/earnings'),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(80, 36),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                        ),
                        child: const Text('উত্তোলন'),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 20),

              // Quick links
              Row(
                children: [
                  _quickLink('💰', 'আয়', () => Navigator.pushNamed(context, '/earnings')),
                  const SizedBox(width: 10),
                  _quickLink('📄', 'KYC', () => Navigator.pushNamed(context, '/kyc')),
                  const SizedBox(width: 10),
                  _quickLink('🆘', 'SOS 112', () {}),
                ],
              ),
              const SizedBox(height: 20),

              // Co-op info
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('🤝 চালাও সমবায় — আজকের কমিশন', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _infoRow('প্ল্যাটফর্ম ফি', '৯%'),
                  _infoRow('আপনার আয়', '৯১%'),
                  _infoRow('পেআউট পদ্ধতি', 'তাৎক্ষণিক UPI'),
                ]),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.bold)),
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
        ]),
      ),
    );
  }

  Widget _quickLink(String icon, String label, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 72,
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(icon, style: const TextStyle(fontSize: 22)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w500)),
          ]),
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}
