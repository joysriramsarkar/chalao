import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/api_service.dart';

class RideRequestScreen extends StatefulWidget {
  const RideRequestScreen({super.key});

  @override
  State<RideRequestScreen> createState() => _RideRequestScreenState();
}

class _RideRequestScreenState extends State<RideRequestScreen> {
  late Map<String, dynamic> _args;
  final _dropoffController = TextEditingController();
  String _dropoffAddress = '';
  String _paymentMethod = 'cash';
  bool _isLoading = false;
  bool _initialized = false;
  num? _quotedFare;
  num? _quotedDistanceKm;

  final _paymentMethods = [
    {'id': 'cash', 'icon': '💵', 'name': 'নগদ'},
    {'id': 'upi', 'icon': '📱', 'name': 'UPI'},
    {'id': 'wallet', 'icon': '👛', 'name': 'ওয়ালেট'},
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
      _initialized = true;
      _loadQuote();
    }
  }

  double _localDistanceKm(double lat1, double lng1, double lat2, double lng2) {
    const earthRadiusKm = 6371.0;
    final dLat = (lat2 - lat1) * math.pi / 180;
    final dLng = (lng2 - lng1) * math.pi / 180;
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * math.pi / 180) *
            math.cos(lat2 * math.pi / 180) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    final km = earthRadiusKm * c * 1.3;
    return math.max(1, (km * 10).round() / 10).toDouble();
  }

  Future<void> _loadQuote() async {
    try {
      final pickupLat = (_args['pickupLat'] as num).toDouble();
      final pickupLng = (_args['pickupLng'] as num).toDouble();
      final result = await ApiService.quoteRide(
        vehicleType: _args['vehicleType'] as String? ?? 'sedan',
        pickupLat: pickupLat,
        pickupLng: pickupLng,
        dropoffLat: pickupLat + 0.05,
        dropoffLng: pickupLng + 0.05,
      );
      final quote = result['quote'] as Map<String, dynamic>?;
      if (!mounted || quote == null) return;
      setState(() {
        _quotedFare = num.tryParse('${quote['riderPayable']}');
        _quotedDistanceKm = num.tryParse('${quote['distanceKm']}');
      });
    } catch (_) {
      // Fall back to the local tariff below; the server remains authoritative.
    }
  }

  double _estimateFare(String vehicleType, double distanceKm) {
    const rates = <String, List<double>>{
      'bike': [25, 9, 0.5],
      'auto': [35, 12, 0.8],
      'car': [70, 18, 1.5],
      'sedan': [70, 18, 1.5],
      'suv': [70, 18, 1.5],
      'pink': [30, 11, 0.6],
      'share': [20, 7, 0.4],
      'green': [30, 10, 0.5],
      'ev': [30, 10, 0.5],
    };
    final rate = rates[vehicleType] ?? const [70, 18, 1.5];
    final durationMin = math.max(4, ((distanceKm / 22) * 60 + 3).round());
    return (rate[0] + (distanceKm * rate[1]).round() + (durationMin * rate[2]).round())
        .toDouble();
  }

  Future<void> _bookRide() async {
    if (_dropoffAddress.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('গন্তব্য লিখুন'), backgroundColor: Colors.orange),
      );
      return;
    }
    setState(() => _isLoading = true);
    try {
      final pickupLat = (_args['pickupLat'] as num).toDouble();
      final pickupLng = (_args['pickupLng'] as num).toDouble();
      final distanceKm = _localDistanceKm(pickupLat, pickupLng, pickupLat + 0.05, pickupLng + 0.05);
      final result = await ApiService.requestRide(
        vehicleType: _args['vehicleType'] as String? ?? 'sedan',
        pickupLat: pickupLat,
        pickupLng: pickupLng,
        pickupAddress: _args['pickupAddress'] as String,
        dropoffLat: pickupLat + 0.05,
        dropoffLng: pickupLng + 0.05,
        dropoffAddress: _dropoffAddress,
        paymentMethod: _paymentMethod,
        distanceKm: distanceKm,
      );
      context.read<AppState>().setCurrentRide(result['ride'] as Map<String, dynamic>);
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/active-ride');
    } on ApiException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _dropoffController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vehicleType = _args['vehicleType'] as String? ?? 'sedan';
    final pickupLat = (_args['pickupLat'] as num).toDouble();
    final pickupLng = (_args['pickupLng'] as num).toDouble();
    final localDistance = _localDistanceKm(pickupLat, pickupLng, pickupLat + 0.05, pickupLng + 0.05);
    final distanceKm = _quotedDistanceKm ?? localDistance;
    final fare = _quotedFare ?? _estimateFare(vehicleType, localDistance);
    final vehicleIcons = {'bike': '🏍️', 'auto': '🛺', 'sedan': '🚗', 'suv': '🚙', 'ev': '⚡', 'pink': '🌸'};
    final vehicleNames = {'bike': 'বাইক', 'auto': 'অটো', 'sedan': 'সেডান', 'suv': 'SUV', 'ev': 'গ্রিন EV', 'pink': 'Pink'};

    return Scaffold(
      appBar: AppBar(title: const Text('রাইড বুক')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Route card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F7FF),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E0FF)),
                ),
                child: Column(
                  children: [
                    Row(children: [
                      const Icon(Icons.circle, color: Color(0xFF6C3DF4), size: 12),
                      const SizedBox(width: 10),
                      Expanded(child: Text(_args['pickupAddress'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w500))),
                    ]),
                    const Padding(
                      padding: EdgeInsets.only(left: 5, top: 4, bottom: 4),
                      child: SizedBox(height: 16, child: VerticalDivider(color: Color(0xFF6C3DF4), width: 2)),
                    ),
                    Row(children: [
                      const Icon(Icons.location_on, color: Colors.red, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _dropoffController,
                          decoration: const InputDecoration(
                            hintText: 'গন্তব্য লিখুন...',
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                          onChanged: (v) => setState(() => _dropoffAddress = v),
                        ),
                      ),
                    ]),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Vehicle + fare
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF6C3DF4), Color(0xFF3B82F6)]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Text(vehicleIcons[vehicleType] ?? '🚗', style: const TextStyle(fontSize: 36)),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(vehicleNames[vehicleType] ?? 'সেডান', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('আনুমানিক ${distanceKm.toStringAsFixed(1)} কিমি · ১৫-২০ মিনিট', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      ]),
                    ),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text('₹${fare.toStringAsFixed(0)}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22)),
                      const Text('৯% সমবায় ফি', style: TextStyle(color: Colors.white70, fontSize: 10)),
                    ]),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text('পেমেন্ট পদ্ধতি', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
              const SizedBox(height: 12),
              Row(
                children: _paymentMethods.map((p) {
                  final selected = _paymentMethod == p['id'];
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _paymentMethod = p['id'] as String),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: selected ? const Color(0xFF6C3DF4).withValues(alpha: 0.1) : const Color(0xFFF8F7FF),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: selected ? const Color(0xFF6C3DF4) : const Color(0xFFE2E0FF),
                            width: selected ? 2 : 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(p['icon'] as String, style: const TextStyle(fontSize: 22)),
                            const SizedBox(height: 4),
                            Text(p['name'] as String, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: _isLoading ? null : _bookRide,
                child: _isLoading
                    ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                    : Text('রাইড বুক — ₹${fare.toStringAsFixed(0)}'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
