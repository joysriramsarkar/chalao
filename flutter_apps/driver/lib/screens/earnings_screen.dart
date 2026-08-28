import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/api_service.dart';

class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});
  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Map<String, dynamic>> _earnings = [];
  Map<String, dynamic>? _summary;
  Map<String, dynamic>? _today;
  bool _loading = true;
  String _period = 'today';
  final _upiCtrl = TextEditingController();
  bool _payoutLoading = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _tabs.addListener(() {
      final periods = ['today', 'week', 'month'];
      _loadEarnings(periods[_tabs.index]);
    });
    _loadEarnings('today');
  }

  Future<void> _loadEarnings(String period) async {
    setState(() { _loading = true; _period = period; });
    try {
      final res = await ApiService.getEarnings(period: period);
      setState(() {
        _earnings = List<Map<String, dynamic>>.from(res['earnings'] as List);
        _summary = res['summary'] as Map<String, dynamic>?;
        _today = res['today'] as Map<String, dynamic>?;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _requestPayout() async {
    final upi = _upiCtrl.text.trim();
    if (upi.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('UPI ID লিখুন'), backgroundColor: Colors.orange),
      );
      return;
    }
    setState(() => _payoutLoading = true);
    try {
      final res = await ApiService.requestPayout(upi);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message'] as String? ?? 'পেআউট চালু হয়েছে'), backgroundColor: const Color(0xFF10B981)),
      );
      _loadEarnings(_period);
    } on ApiException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _payoutLoading = false);
    }
  }

  @override
  void dispose() { _tabs.dispose(); _upiCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final pending = double.tryParse(_summary?['pending_payout']?.toString() ?? '0') ?? 0;
    final totalNet = double.tryParse(_summary?['total_net']?.toString() ?? '0') ?? 0;
    final todayRides = _today?['rides_today'] ?? 0;
    final todayEarned = double.tryParse(_today?['earned_today']?.toString() ?? '0') ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('আয় ও পেআউট'),
        bottom: TabBar(
          controller: _tabs,
          labelColor: const Color(0xFF22D3EE),
          unselectedLabelColor: Colors.white38,
          indicatorColor: const Color(0xFF22D3EE),
          tabs: const [Tab(text: 'আজ'), Tab(text: 'সপ্তাহ'), Tab(text: 'মাস')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF22D3EE)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Summary cards
                  Row(
                    children: [
                      _statCard('আজকের আয়', '₹${todayEarned.toStringAsFixed(0)}', const Color(0xFF22D3EE)),
                      const SizedBox(width: 12),
                      _statCard('আজকের যাত্রা', '$todayRides', const Color(0xFF10B981)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _statCard('মোট আয় (৩০ দিন)', '₹${totalNet.toStringAsFixed(0)}', const Color(0xFF8B5CF6)),
                      const SizedBox(width: 12),
                      _statCard('বাকি পেআউট', '₹${pending.toStringAsFixed(0)}', Colors.amber),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // UPI Payout
                  if (pending > 0) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF22D3EE).withOpacity(0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            const Text('⚡', style: TextStyle(fontSize: 20)),
                            const SizedBox(width: 8),
                            Text('₹${pending.toStringAsFixed(0)} উত্তোলন করুন',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                          ]),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _upiCtrl,
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(
                              labelText: 'UPI ID',
                              hintText: '9876543210@upi',
                              hintStyle: TextStyle(color: Colors.white24),
                            ),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _payoutLoading ? null : _requestPayout,
                            child: _payoutLoading
                                ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Color(0xFF0F172A), strokeWidth: 2.5))
                                : const Text('UPI পেআউট করুন'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Earnings list
                  const Text('সাম্প্রতিক যাত্রার আয়', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 12),
                  if (_earnings.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Text('এই সময়ে কোনো আয় নেই', style: TextStyle(color: Colors.white.withOpacity(0.4))),
                      ),
                    )
                  else
                    ...(_earnings.map((e) {
                      final net = double.tryParse(e['net_amount']?.toString() ?? '0') ?? 0;
                      final gross = double.tryParse(e['gross_amount']?.toString() ?? '0') ?? 0;
                      final commPct = e['commission_pct'] ?? 9;
                      final payoutStatus = e['payout_status'] as String? ?? 'pending';
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFF334155)),
                        ),
                        child: Row(
                          children: [
                            const Text('🚗', style: TextStyle(fontSize: 24)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(e['pickup_address'] as String? ?? '—',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 13),
                                  overflow: TextOverflow.ellipsis),
                                Text('ভাড়া: ₹${gross.toStringAsFixed(0)} · কমিশন: $commPct%',
                                  style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
                              ]),
                            ),
                            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                              Text('₹${net.toStringAsFixed(0)}',
                                style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 18)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: payoutStatus == 'paid' ? const Color(0xFF10B981).withOpacity(0.1) : Colors.amber.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(payoutStatus == 'paid' ? 'পরিশোধিত' : 'বাকি',
                                  style: TextStyle(
                                    color: payoutStatus == 'paid' ? const Color(0xFF10B981) : Colors.amber,
                                    fontSize: 10, fontWeight: FontWeight.w600)),
                              ),
                            ]),
                          ],
                        ),
                      );
                    }).toList()),
                ],
              ),
            ),
    );
  }

  Widget _statCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
        ]),
      ),
    );
  }
}
