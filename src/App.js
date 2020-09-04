import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { MenuItem, FormControl, Select, Menu, Card, CardContent } from '@material-ui/core';
import Table from './Table';
import InfoBox from './InfoBox';
import Map from './Map';
import './App.css';
import { sortData, prettyPrintStat } from './utils';
import LineGraph from './LineGraph';
import 'leaflet/dist/leaflet.css';

function App() {
	const [ countries, setCountries ] = useState([]);
	const [ country, setCountry ] = useState('worldwide');
	const [ countryInfo, setCountryInfo ] = useState({});
	const [ tableData, setTableData ] = useState([]);
	const [ mapCenter, setMapCenter ] = useState({ lat: -11.6455, lng: 43.333302 });
	const [ mapZoom, setMapZoom ] = useState(3);
	const [ mapCountries, setMapCountries ] = useState([]);
	const [ casesType, setCasesType ] = useState('cases');

	useEffect(() => {
		async function fetchData() {
			const res = await axios.get('https://disease.sh/v3/covid-19/all');
			setCountryInfo(res.data);
		}
		fetchData();
	}, []);

	useEffect(() => {
		const getCountriesData = async () => {
			const res = await axios.get('https://disease.sh/v3/covid-19/countries');
			const countries = res.data.map((country) => ({
				name: country.country,
				value: country.countryInfo.iso2
			}));

			const sortedData = sortData(res.data);
			setTableData(sortedData);
			setCountries(countries);
			setMapCountries(res.data);
		};
		getCountriesData();
	}, []);

	const onCountryChange = async (e) => {
		const countryCode = e.target.value;

		// https://disease.sh/v3/covid-19/all
		// https://disease.sh/v3/covid-19/countries/{country}
		const url =
			countryCode === 'worldwide'
				? 'https://disease.sh/v3/covid-19/all'
				: `https://disease.sh/v3/covid-19/countries/${countryCode}`;

		try {
			const res = await axios.get(url);

			setCountry(countryCode);
			setCountryInfo(res.data);
			countryCode === 'worldwide'
				? setMapCenter([ -11.6455, 43.333302 ])
				: setMapCenter([ res.data.countryInfo.lat, res.data.countryInfo.long ]);
			setMapZoom(4);
		} catch (err) {
			console.log(err);
		}
	};

	return (
		<div className="app">
			<div className="app__left">
				<div className="app__header">
					<h1>COVID-19 TRACKER</h1>
					<FormControl className="app__dropdown">
						<Select variant="outlined" value={country} onChange={onCountryChange}>
							<MenuItem value="worldwide">Worldwide</MenuItem>
							{countries.map((country) => (
								<MenuItem key={uuidv4()} value={country.value}>
									{country.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</div>
				<div className="app__stats">
					{/* 3 InfoBoxes */}
					<InfoBox
						isRed
						active={casesType === 'cases'}
						onClick={(e) => setCasesType('cases')}
						title="Coronavirus cases"
						total={prettyPrintStat(countryInfo.cases)}
						cases={prettyPrintStat(countryInfo.todayCases)}
					/>
					<InfoBox
						isTextGreen
						active={casesType === 'recovered'}
						onClick={(e) => setCasesType('recovered')}
						title="Recovered"
						total={prettyPrintStat(countryInfo.recovered)}
						cases={prettyPrintStat(countryInfo.todayRecovered)}
					/>
					<InfoBox
						isRed
						active={casesType === 'deaths'}
						onClick={(e) => setCasesType('deaths')}
						title="Deaths"
						total={prettyPrintStat(countryInfo.deaths)}
						cases={prettyPrintStat(countryInfo.todayDeaths)}
					/>
				</div>

				{/* Map */}
				<Map casesType={casesType} center={mapCenter} zoom={mapZoom} countries={mapCountries} />
			</div>
			<Card className="app__right">
				<CardContent>
					{/* Table */}
					<h3>Live Cases by Country</h3>
					<Table countries={tableData} />
					{/* Graph */}
					<h3 style={{ marginTop: '20px', marginBottom: '20px' }}>Worlwide new {casesType}</h3>
					<LineGraph casesType={casesType} className="app__graph" />
				</CardContent>
			</Card>
		</div>
	);
}

export default App;
