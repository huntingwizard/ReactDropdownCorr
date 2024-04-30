import React, { Component } from "react";
import * as d3 from "d3";
import tips from './tips.csv'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedCell: null,
      target:"total_bill",
      radio: "sex",
      data:[]
    };
  }
  calculateCorrelation(arr1, arr2) {
    const n = 244;
    let sum=0;
    const first=[]
    this.state.data.forEach(function(d){
      sum+=d[arr1];
      first.push(d[arr1])
    });
    const mean1 = sum/n;
    sum=0;
    const second=[]
    this.state.data.forEach(function(d){
      sum+=d[arr2];
      second.push(d[arr2])
    });
    const mean2 = sum/n;
    sum=0
    for (let i = 0; i < n; i++) {
      
      sum+=(first[i]-mean1)*(second[i]-mean2)
    }
    
    const cov = sum / n;
    const sd1 = d3.deviation(first);
    const sd2 = d3.deviation(second);
    return (cov / (sd1 * sd2)).toFixed(2);
  }
  componentDidMount() {
    var self=this
    d3.csv(tips, function(d){
      return {
        tip: parseFloat(d.tip),
        total_bill:parseFloat(d.total_bill),
        size: parseInt(d.size),
        day:d.day,
        sex: d.sex,
        smoker: d.smoker,
        time: d.time,
      }
    }).then(function(csv_data){
      self.setState({data:csv_data})
      //console.log(csv_data)
    })
    .catch(function(err){
      console.log(err)
    })

  }
  
  componentDidUpdate() {
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 10, bottom: 30, left: 20 },
        w = 500 - margin.left - margin.right,
        h = 300 - margin.top - margin.bottom;
    // set the dimensions and margins of the graph
    var data=this.state.data;

    var temp_data = d3.flatRollup(
      data,     
      (d) => d3.mean(d, (da) => da[this.state.target]),
      (d) => d[this.state.radio],
    );

    
    var containerb = d3
      .select(".child2_svg")
      .attr("width", w + margin.left + margin.right)
      .attr("height", h + margin.top + margin.bottom)
      .select(".g_2")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X axis
    var xb_data = temp_data.map((item) => item[0]);
    var xb_scale = d3
      .scaleBand()
      .domain(xb_data)
      .range([margin.left, w])
      .padding(0.2);

    containerb
      .selectAll(".x_axis_g")
      .data([0])
      .join("g")
      .attr("class", "x_axis_g")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(xb_scale));
    // Add Y axis
    var yb_data = temp_data.map((item) => item[1]);
    var yb_scale = d3
      .scaleLinear()
      .domain([0, d3.max(yb_data)])
      .range([h, 0]);

    containerb
      .selectAll(".y_axis_g")
      .data([0])
      .join("g")
      .attr("class", "y_axis_g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yb_scale));
    containerb.selectAll("rect").remove()
    containerb
      .selectAll("rect")
      .data(temp_data)
      .enter()
      .append("rect")
      .attr("x", function (d) {
        return xb_scale(d[0]);
      })
      .attr("y", function (d) {
        return yb_scale(d[1]);
      })
      .attr("width", xb_scale.bandwidth())
      .attr("height", function (d) {
        return h - yb_scale(d[1]);
      })
      .attr("fill", "#69b3a2");
      

    // Correlation Matrix
    
    var correlationData = [
      [1, this.calculateCorrelation("total_bill","tip"), this.calculateCorrelation("total_bill","size")],
      [this.calculateCorrelation("total_bill","tip"), 1, this.calculateCorrelation("size","tip")],
      [this.calculateCorrelation("total_bill","size"), this.calculateCorrelation("size","tip"), 1]
    ];
    var cororo=[
      [1, this.calculateCorrelation("total_bill","tip"), this.calculateCorrelation("total_bill","size")],
      [this.calculateCorrelation("total_bill","tip"), 1, this.calculateCorrelation("size","tip")],
      [this.calculateCorrelation("total_bill","size"), this.calculateCorrelation("size","tip"), 1]
    ];
    var color = d3.scaleSequential(d3.interpolateRdYlBu)
      .domain([-1, 1]);

    var matrix = d3.select("svg#correlation-matrix")
      .attr("width", 200)
      .attr("height", 200)
      .append("g")
      .attr("transform", "translate(20,20)");

    var rows = matrix.selectAll(".row")
      .data(correlationData)
      .enter().append("g")
      .attr("class", "row")
      .attr("transform", (d, i) => `translate(0,${i * 40})`)
      ;

    var cells = rows.selectAll(".cell")
      .data(d => d)
      .enter().append("rect")
      .attr("class", "cell")
      .attr("x", (d, i) => i * 40)
      .attr("width", 40)
      .attr("height", 40)
      .on("click", (event, i) => {this.setState({ selectedCell: [event.pageX, event.pageY] })})
      .style("fill", d => color(d));
      rows
      .selectAll('.label')
      .data(correlationData[0])
      .join('text')
      .classed('label', true)
      .attr('x', (d, i) => i * 40+10)
      .attr('y', 20)
      .text((d,i) => d)
      .on("click", (d, i) => {console.log(i,d)})
      ;
    // Scatterplot
    let scatterx="";
    let scattery="";
    if(this.state.selectedCell && this.state.selectedCell[0]<560){ 
      scatterx="total_bill";
    }
    else if(this.state.selectedCell && this.state.selectedCell[0]>600){ 
      scatterx="size"
    }
    else{ 
      scatterx="tip"
    }

    if(this.state.selectedCell && this.state.selectedCell[1]<548){ 
      scattery="total_bill";
    }
    else if(this.state.selectedCell && this.state.selectedCell[1]>588){ 
      scattery="size"
    }
    else{ 
      scattery="tip"
    }
    console.log(scatterx,scattery)
    var container = d3.select(".child1_svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .select(".g_1")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Add X axis
    var x_data = data.map(item=>item[scatterx])
    const x_scale = d3.scaleLinear().domain([0, d3.max(x_data)]).range([margin.left, w]);
    
    container.selectAll(".x_axis_g").data([0]).join('g').attr("class", 'x_axis_g')
    .attr("transform", `translate(0, ${h})`).call(d3.axisBottom(x_scale));

    // Add Y axis
    var y_data = data.map(item=>item[scattery])
    const y_scale = d3.scaleLinear().domain([0, d3.max(y_data)]).range([h, 0]);
    container.selectAll(".y_axis_g").data([0]).join('g').attr("class", 'x_axis_g')
    .attr("transform", `translate(${margin.left}, 0)`).call(d3.axisLeft(y_scale));

    container.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", function(d){
            return x_scale(d.total_bill);
        })
        .attr("cy", function(d){
            return y_scale(d.tip);
        })
        .attr("r", 3)
        .style("fill", "#69b3a2");
  }

  render() {
    return (
      <div className="parent">
        <div className="child1">
        <select onChange={(event)=>this.setState({target:event.target.value})}>
          <option>total_bill</option>
          <option>tip</option>
          <option>size</option>
        </select>
        <svg id="demo2" width="500" height="300"></svg>
      </div>
        <div className="child2">
          <form>
            <div className="radio">
              <label>
                <input
                  type="radio"
                  value="sex"
                  checked={this.state.radio === "sex"}
                  onChange={(event)=>this.setState({radio:event.target.value})}
                />
                sex
              </label>
            </div>
            <div className="radio">
              <label>
                <input
                  type="radio"
                  value="smoker"
                  checked={this.state.radio === "smoker"}
                  onChange={(event)=>this.setState({radio:event.target.value})}
                />
                smoker
              </label>
            </div>
            <div className="radio">
              <label>
                <input
                  type="radio"
                  value="day"
                  checked={this.state.radio === "day"}
                  onChange={(event)=>this.setState({radio:event.target.value})}
                />
                day
              </label>
            </div>
            <div className="radio">
              <label>
                <input
                  type="radio"
                  value="time"
                  checked={this.state.radio === "time"}
                  onChange={(event)=>this.setState({radio:event.target.value})}
                />
                time
              </label>
            </div>
          </form>
          <svg className="child2_svg">
            <g className="g_2"></g>
          </svg>
          <svg id="correlation-matrix"></svg>
          
        </div>
        <div className="child3">
          <svg className="child1_svg"> 
              <g className="g_1"></g>
          </svg>
        </div>
      </div>
    );
  }
}

export default App;