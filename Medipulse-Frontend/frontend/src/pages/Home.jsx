import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import WhyChooseMedipulse from './WhyChooseMedipulse'
import Stats from './Stats'

const Home = () => {
  return (
    <div>
      <Header />   
      <WhyChooseMedipulse/>
      <SpecialityMenu />
      <TopDoctors />
      <Banner />
      <Stats/>
    </div>
  )
}

export default Home