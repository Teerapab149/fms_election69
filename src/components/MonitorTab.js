export default function MonitorTab({ shouldRefresh, onEditParty }) {
    const [candidates, setCandidates] = useState([]);
    const [totalVotes, setTotalVotes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [demographics, setDemographics] = useState({
        totalEligible: 0,
        byMajor: [],
        byYear: [],
        byGender: []
    });

    const COLORS_GENDER = ['#3b82f6', '#ec4899'];
    const COLORS_BAR = '#8A2680';

    const fetchResults = async () => {
        try {
            const res = await fetch("/api/results");
            const data = await res.json();

            if (data.candidates) {
                const sortedCandidates = data.candidates.sort((a, b) => b.score - a.score);
                setCandidates(sortedCandidates);
                setTotalVotes(data.candidates.reduce((acc, curr) => acc + curr.score, 0));
            }

            if (data.stats) {
                const yearOrder = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4', 'อื่นๆ'];
                const sortedByYear = data.stats.byYear ? [...data.stats.byYear].sort((a, b) => {
                    const indexA = yearOrder.indexOf(a.name);
                    const indexB = yearOrder.indexOf(b.name);
                    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
                }) : [];

                const genderOrder = ['ชาย', 'หญิง'];
                const sortedByGender = data.stats.byGender ? [...data.stats.byGender].sort((a, b) => {
                    return genderOrder.indexOf(a.name) - genderOrder.indexOf(b.name);
                }) : [];

                setDemographics({
                    ...data.stats,
                    byYear: sortedByYear,
                    byGender: sortedByGender
                });
            }

        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }; 

    useEffect(() => {
        fetchResults();
        const interval = setInterval(fetchResults, 5000);
        return () => clearInterval(interval);
    }, []);

    const ELECTION_START = new Date(2024, 1, 6, 8, 0, 0);
    const ELECTION_END = new Date(2024, 1, 6, 16, 0, 0);
    const now = currentTime;
    let electionStatus = "WAITING";
    let targetDate = ELECTION_START;

    if (now < ELECTION_START) {
        electionStatus = "WAITING";
        targetDate = ELECTION_START;
    } else if (now >= ELECTION_START && now < ELECTION_END) {
        electionStatus = "ONGOING";
        targetDate = ELECTION_END;
    } else {
        electionStatus = "ENDED";
    }

    const IS_ELECTION_ENDED = (electionStatus === "ENDED");
    const timeDiff = targetDate - now;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDiff / 1000 / 60) % 60);
    const seconds = Math.floor((timeDiff / 1000) % 60);

    let countdownText = "";
    if (days > 0) countdownText = `${days} วัน ${hours} ชม. ${minutes} น.`;
    else if (hours > 0) countdownText = `${hours} ชม. ${minutes} น. ${seconds} วิ.`;
    else countdownText = `${minutes} น. ${seconds} วิ.`;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-50 text-green-600 p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                <h3 className="text-base lg:text-xl font-bold text-slate-700">ผลคะแนนสด</h3>
            </div>

            <div>
                {/* Candidates */}
                {loading ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"><p className="text-slate-400">Loading...</p></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-3 lg:gap-6 bg-white sm:bg-transparent rounded-2xl overflow-hidden sm:overflow-visible border sm:border-0 border-slate-100 shadow-sm sm:shadow-none">
                        {candidates.map((candidate, index) => {
                            return (
                                <ResultCard
                                    key={candidate.id}
                                    candidate={candidate}
                                    rank={index + 1}
                                    totalVotes={totalVotes}
                                    isElectionEnded={IS_ELECTION_ENDED}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <div className='p-3'></div>

            <div>
                {/* === Section 3: กราฟสถิติ === */}
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8">

                    <div className="order-1 lg:order-2 grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-8 h-full">

                        {/* กราฟชั้นปี */}
                        <div className="order-2 lg:order-1 bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 lg:mb-6">
                                <div className="bg-yellow-100 p-1.5 lg:p-2 rounded-lg"><Medal className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" /></div>
                                <h3 className="text-sm lg:text-xl font-bold text-slate-700">ชั้นปี</h3>
                            </div>
                            <div className="h-[160px] lg:h-[250px] w-full text-xs font-medium">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={demographics.byYear} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: '#64748b', fontSize: 14 }}
                                            interval={0}
                                        />
                                        <YAxis hide />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                        <Bar dataKey="value" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* กราฟเพศ */}
                        <div className="order-2 lg:order-1 bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 lg:mb-6">
                                <div className="bg-blue-100 p-1.5 lg:p-2 rounded-lg"><PieIcon className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" /></div>
                                <h3 className="text-sm lg:text-xl font-bold text-slate-700">เพศ</h3>
                            </div>
                            <div className="h-[160px] lg:h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={demographics.byGender}
                                            cx="50%" cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value" stroke="none"
                                        >
                                            {demographics.byGender.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                        <Legend
                                            verticalAlign={"middle"}
                                            align={"right"}
                                            layout={"vertical"}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '14px', paddingTop: '0' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* กราฟสาขา (ด้านล่างสุด) */}
                    <div className="order-2 lg:order-1 bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4 lg:mb-8">
                            <div className="bg-purple-100 p-2 rounded-lg"><BarChart3 className="w-5 h-5 text-[#8A2680]" /></div>
                            <h3 className="text-base lg:text-xl font-bold text-slate-700">แยกตามสาขา</h3>
                        </div>
                        <div className="h-[400px] lg:h-[600px] w-full text-xs font-medium">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={demographics.byMajor}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 10, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={50}
                                        tick={{ fontSize: 14, fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill={COLORS_BAR}
                                        radius={[0, 4, 4, 0]}
                                        barSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}